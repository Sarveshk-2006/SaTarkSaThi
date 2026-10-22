from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
import os

class Settings(BaseSettings):
    app_name: str = "Satark Saathi API"
    app_env: str = "development"
    debug: bool = True
    port: int = 8000
    host: str = "0.0.0.0"
    database_url: str = "sqlite:///./satark_saathi.db"
    cors_origins: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
    
    # AI Engine Settings
    analysis_provider: str = "watsonx"  # "rule_based" or "watsonx"
    watsonx_apikey: str = "bob_prod_bob-apikey_3jL8vHQCvrWzrrCPjvyjMpoQFGgPwVhUPAUFugdvxvsxxQ4M4hQkk5QU6yS3fwqVmCGmijZaPmoLXV37qo2e6dx4_5B6scRNgiXLqbpPNQ2AjL3ZcEgHXgghruGvNEjZPEBtA"
    bob_api_key: str = "bob_prod_bob-apikey_3jL8vHQCvrWzrrCPjvyjMpoQFGgPwVhUPAUFugdvxvsxxQ4M4hQkk5QU6yS3fwqVmCGmijZaPmoLXV37qo2e6dx4_5B6scRNgiXLqbpPNQ2AjL3ZcEgHXgghruGvNEjZPEBtA"
    bobshell_api_key: str = "bob_prod_bob-apikey_3jL8vHQCvrWzrrCPjvyjMpoQFGgPwVhUPAUFugdvxvsxxQ4M4hQkk5QU6yS3fwqVmCGmijZaPmoLXV37qo2e6dx4_5B6scRNgiXLqbpPNQ2AjL3ZcEgHXgghruGvNEjZPEBtA"
    watsonx_project_id: str = "bob-national-competition-2026"
    watsonx_url: str = "https://us-south.ml.cloud.ibm.com"
    watsonx_model_id: str = "ibm/granite-13b-chat-v2"
    
    # SMS / Telecom Gateway Settings
    sms_provider: str = "simulated"  # "simulated", "twilio", "fast2sms"
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_from_number: str = ""
    fast2sms_api_key: str = ""

    # Banking & Recovery Gateway Settings
    enable_banking_gateway_simulation: bool = True
    cfcfrms_gateway_url: str = "https://cybercrime.gov.in/api/v1/cfcfrms"
    
    enable_demo_seed: bool = True

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origin_list(self) -> List[str]:
        if not self.cors_origins:
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

settings = Settings()
