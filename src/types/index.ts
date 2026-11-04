export interface PortData {
    id: string;
    title: string;
    author: string;
    version: string;
    original_platform: string;
    url: string;
    source_type: string;
    asset_type: string;
    steamgriddb_id: string | null;
    grid_image_url: string | null;
    instructions_markdown?: string | null;
    last_updated?: string | null;
}
