from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
import os


class Settings(BaseSettings):
    app_name: str = "Satark Saathi API"
    app_env: str = "development"
    debug: bool = True
    port: int = 8000
    host: str = "0.0.0.0"
    database_url: str = "sqlite:///./satark_saathi.db"
    cors_origins: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:5174"

    # AI Engine Settings
    # Set ANALYSIS_PROVIDER=watsonx and supply WATSONX_APIKEY + WATSONX_PROJECT_ID
    # in your .env to enable IBM watsonx.ai inference.
    # Without credentials the application runs the deterministic rule engine transparently.
    analysis_provider: str = "rule_based"  # "rule_based" | "watsonx"
    watsonx_apikey: str = ""
    watsonx_project_id: str = ""
    watsonx_url: str = "https://us-south.ml.cloud.ibm.com"
    # granite-13b-chat-v2 is deploy-on-demand only on current watsonx.ai; granite-4-h-small is listed
    # as pay-per-token. Confirm availability for your region/project before relying on it.
    watsonx_model_id: str = "ibm/granite-4-h-small"

    # SMS / Telecom Gateway Settings
    sms_provider: str = "simulated"  # "simulated" | "twilio" | "fast2sms"
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_from_number: str = ""
    fast2sms_api_key: str = ""

    # Banking & Recovery Gateway Settings
    enable_banking_gateway_simulation: bool = True
    enable_demo_seed: bool = True
    cfcfrms_gateway_url: str = "https://cybercrime.gov.in/api/v1/cfcfrms"

    # Authentication & JWT Configuration
    jwt_secret_key: str = "satark_saathi_dev_secret_key_change_in_production_min32chars"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 120
    jwt_issuer: str = "satark-saathi-auth"
    jwt_audience: str = "satark-saathi-app"
    allow_demo_header_auth: bool = True

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() in ("production", "prod")

    def validate_production_security(self):
        """Fails closed if running in production without secure JWT configuration."""
        if self.is_production:
            if not self.jwt_secret_key or "change_in_production" in self.jwt_secret_key or len(self.jwt_secret_key) < 32:
                raise ValueError("FATAL SECURITY CONFIGURATION: Production mode requires a secure, non-default JWT_SECRET_KEY of at least 32 characters.")
            if self.allow_demo_header_auth:
                raise ValueError("FATAL SECURITY CONFIGURATION: ALLOW_DEMO_HEADER_AUTH must be False in production mode.")

    @property
    def cors_origin_list(self) -> List[str]:
        if not self.cors_origins:
            return ["http://localhost:5173", "http://127.0.0.1:5173"]
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def watsonx_configured(self) -> bool:
        """True only when both an API key and project ID are supplied via environment config."""
        return bool(self.watsonx_apikey and self.watsonx_project_id)


settings = Settings()
settings.validate_production_security()
