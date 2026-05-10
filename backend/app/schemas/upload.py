from pydantic import BaseModel


class UploadResponse(BaseModel):
    file_name: str
    stored_path: str
    public_url: str
