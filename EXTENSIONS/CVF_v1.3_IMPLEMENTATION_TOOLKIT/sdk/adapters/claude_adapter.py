"""
Claude Adapter

Adapter for Anthropic Claude models.
"""

import os
from typing import Dict, Any, Optional

from .base_adapter import BaseAdapter
from ..models.skill_contract import SkillContract


class ClaudeAdapter(BaseAdapter):
    """
    Adapter for Anthropic Claude API
    
    Translates CVF Skill Contracts into Claude API calls.
    """
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "claude-sonnet-4-20250514",
        actor: str = "claude_adapter",
    ):
        """
        Initialize Claude adapter
        
        Args:
            api_key: Anthropic API key (or set ANTHROPIC_API_KEY env var)
            model: Claude model to use
            actor: Actor name for audit traces
        """
        super().__init__(adapter_id=f"claude_{model}", actor=actor)
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        self.model = model
        self._client = None
    
    @property
    def adapter_type(self) -> str:
        return "claude"
    
    def _get_client(self):
        """Get or create Anthropic client"""
        if self._client is None:
            try:
                from anthropic import Anthropic
                self._client = Anthropic(api_key=self.api_key)
            except ImportError:
                raise ImportError(
                    "anthropic package required. Install with: pip install anthropic"
                )
        return self._client
    
    def _build_prompt(self, contract: SkillContract, inputs: Dict[str, Any]) -> str:
        """Build prompt from contract and inputs"""
        prompt_parts = [
            f"# Task: {contract.description}",
            "",
            "## Constraints",
            f"- Domain: {contract.domain}",
            f"- Risk Level: {contract.risk_level.value}",
            "",
            "## Inputs",
        ]
        
        for field in contract.input_spec:
            value = inputs.get(field.name, field.default)
            prompt_parts.append(f"- {field.name}: {value}")
        
        prompt_parts.extend([
            "",
            "## Expected Outputs",
        ])
        
        for field in contract.output_spec:
            prompt_parts.append(f"- {field.name} ({field.type})")
        
        prompt_parts.extend([
            "",
            "Please provide the outputs in a structured format.",
        ])
        
        return "\n".join(prompt_parts)
    
    def _parse_response(
        self,
        response_text: str,
        contract: SkillContract,
    ) -> Dict[str, Any]:
        """Parse Claude response into structured outputs"""
        outputs = {}
        
        # Simple parsing - in production, use more robust parsing
        for field in contract.output_spec:
            # Try to find field in response
            field_name = field.name
            if field_name.lower() in response_text.lower():
                # For now, just store the response
                outputs[field_name] = response_text
            else:
                outputs[field_name] = None
        
        # If only one output field, use entire response
        if len(contract.output_spec) == 1:
            outputs[contract.output_spec[0].name] = response_text
        
        return outputs
    
    def _execute_impl(
        self,
        contract: SkillContract,
        inputs: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Execute using Claude API"""
        client = self._get_client()
        
        prompt = self._build_prompt(contract, inputs)
        
        response = client.messages.create(
            model=self.model,
            max_tokens=4096,
            messages=[
                {"role": "user", "content": prompt}
            ],
        )
        
        response_text = response.content[0].text
        
        return self._parse_response(response_text, contract)
    
    def health_check(self) -> bool:
        """Check if Claude API is accessible"""
        if not self.api_key:
            return False
        
        try:
            client = self._get_client()
            # Simple check - don't actually make API call
            return client is not None
        except Exception:
            return False
