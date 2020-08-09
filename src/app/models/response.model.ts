export class ApiResponse {
    public current_page = 1;
    public data: any = [];
    public first_page_url: string;
    public from: number;
    public last_page = 1;
    public last_page_url: string;
    public next_page_url: string;
    public path: string;
    public per_page: number;
    public prev_page_url: string;
    public to: number;
    public total = 0;
}
