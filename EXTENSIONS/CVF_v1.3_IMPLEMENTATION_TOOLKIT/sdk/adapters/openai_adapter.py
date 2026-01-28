"""
OpenAI GPT Adapter

Adapter for OpenAI GPT models.
"""

import os
from typing import Dict, Any, Optional

from .base_adapter import BaseAdapter
from ..models.skill_contract import SkillContract


class OpenAIAdapter(BaseAdapter):
    """
    Adapter for OpenAI GPT API
    
    Translates CVF Skill Contracts into OpenAI API calls.
    """
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "gpt-4",
        actor: str = "openai_adapter",
    ):
        """
        Initialize OpenAI adapter
        
        Args:
            api_key: OpenAI API key (or set OPENAI_API_KEY env var)
            model: OpenAI model to use
            actor: Actor name for audit traces
        """
        super().__init__(adapter_id=f"openai_{model}", actor=actor)
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        self.model = model
        self._client = None
    
    @property
    def adapter_type(self) -> str:
        return "openai"
    
    def _get_client(self):
        """Get or create OpenAI client"""
        if self._client is None:
            try:
                from openai import OpenAI
                self._client = OpenAI(api_key=self.api_key)
            except ImportError:
                raise ImportError(
                    "openai package required. Install with: pip install openai"
                )
        return self._client
    
    def _build_messages(
        self,
        contract: SkillContract,
        inputs: Dict[str, Any],
    ) -> list:
        """Build messages from contract and inputs"""
        system_message = f"""You are executing a capability with the following constraints:
- Domain: {contract.domain}
- Risk Level: {contract.risk_level.value}
- Description: {contract.description}

You must provide outputs in the specified format."""

        user_parts = ["## Inputs"]
        for field in contract.input_spec:
            value = inputs.get(field.name, field.default)
            user_parts.append(f"- {field.name}: {value}")
        
        user_parts.extend([
            "",
            "## Expected Outputs",
        ])
        for field in contract.output_spec:
            user_parts.append(f"- {field.name} ({field.type})")
        
        user_parts.append("\nPlease provide the outputs.")
        
        return [
            {"role": "system", "content": system_message},
            {"role": "user", "content": "\n".join(user_parts)},
        ]
    
    def _parse_response(
        self,
        response_text: str,
        contract: SkillContract,
    ) -> Dict[str, Any]:
        """Parse GPT response into structured outputs"""
        outputs = {}
        
        for field in contract.output_spec:
            field_name = field.name
            if field_name.lower() in response_text.lower():
                outputs[field_name] = response_text
            else:
                outputs[field_name] = None
        
        if len(contract.output_spec) == 1:
            outputs[contract.output_spec[0].name] = response_text
        
        return outputs
    
    def _execute_impl(
        self,
        contract: SkillContract,
        inputs: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Execute using OpenAI API"""
        client = self._get_client()
        
        messages = self._build_messages(contract, inputs)
        
        response = client.chat.completions.create(
            model=self.model,
            messages=messages,
            max_tokens=4096,
        )
        
        response_text = response.choices[0].message.content
        
        return self._parse_response(response_text, contract)
    
    def health_check(self) -> bool:
        """Check if OpenAI API is accessible"""
        if not self.api_key:
            return False
        
        try:
            client = self._get_client()
            return client is not None
        except Exception:
            return False
