"""
Generic LLM Adapter

Adapter for local LLMs via Ollama, LM Studio, or compatible APIs.
"""

import os
from typing import Dict, Any, Optional
import json

from .base_adapter import BaseAdapter
from ..models.skill_contract import SkillContract


class GenericAdapter(BaseAdapter):
    """
    Adapter for generic/local LLMs
    
    Supports:
    - Ollama
    - LM Studio
    - Any OpenAI-compatible API
    """
    
    def __init__(
        self,
        base_url: str = "http://localhost:11434",
        model: str = "llama2",
        api_type: str = "ollama",  # 'ollama', 'openai_compatible'
        actor: str = "generic_adapter",
    ):
        """
        Initialize generic adapter
        
        Args:
            base_url: Base URL for the API
            model: Model name
            api_type: Type of API ('ollama' or 'openai_compatible')
            actor: Actor name for audit traces
        """
        super().__init__(adapter_id=f"generic_{model}", actor=actor)
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.api_type = api_type
    
    @property
    def adapter_type(self) -> str:
        return "generic"
    
    def _build_prompt(self, contract: SkillContract, inputs: Dict[str, Any]) -> str:
        """Build prompt from contract and inputs"""
        prompt_parts = [
            f"Task: {contract.description}",
            f"Domain: {contract.domain}",
            "",
            "Inputs:",
        ]
        
        for field in contract.input_spec:
            value = inputs.get(field.name, field.default)
            prompt_parts.append(f"  {field.name}: {value}")
        
        prompt_parts.extend([
            "",
            "Provide outputs for:",
        ])
        
        for field in contract.output_spec:
            prompt_parts.append(f"  {field.name} ({field.type})")
        
        return "\n".join(prompt_parts)
    
    def _execute_ollama(
        self,
        prompt: str,
    ) -> str:
        """Execute using Ollama API"""
        import urllib.request
        import urllib.error
        
        url = f"{self.base_url}/api/generate"
        data = json.dumps({
            "model": self.model,
            "prompt": prompt,
            "stream": False,
        }).encode('utf-8')
        
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode('utf-8'))
                return result.get("response", "")
        except urllib.error.URLError as e:
            raise RuntimeError(f"Failed to connect to Ollama: {e}")
    
    def _execute_openai_compatible(
        self,
        prompt: str,
    ) -> str:
        """Execute using OpenAI-compatible API"""
        import urllib.request
        import urllib.error
        
        url = f"{self.base_url}/v1/chat/completions"
        data = json.dumps({
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 4096,
        }).encode('utf-8')
        
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode('utf-8'))
                return result["choices"][0]["message"]["content"]
        except urllib.error.URLError as e:
            raise RuntimeError(f"Failed to connect to API: {e}")
    
    def _parse_response(
        self,
        response_text: str,
        contract: SkillContract,
    ) -> Dict[str, Any]:
        """Parse response into structured outputs"""
        outputs = {}
        
        if len(contract.output_spec) == 1:
            outputs[contract.output_spec[0].name] = response_text
        else:
            for field in contract.output_spec:
                outputs[field.name] = response_text
        
        return outputs
    
    def _execute_impl(
        self,
        contract: SkillContract,
        inputs: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Execute using configured API"""
        prompt = self._build_prompt(contract, inputs)
        
        if self.api_type == "ollama":
            response_text = self._execute_ollama(prompt)
        else:
            response_text = self._execute_openai_compatible(prompt)
        
        return self._parse_response(response_text, contract)
    
    def health_check(self) -> bool:
        """Check if API is accessible"""
        import urllib.request
        import urllib.error
        
        try:
            if self.api_type == "ollama":
                url = f"{self.base_url}/api/tags"
            else:
                url = f"{self.base_url}/v1/models"
            
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=5) as response:
                return response.status == 200
        except Exception:
            return False
