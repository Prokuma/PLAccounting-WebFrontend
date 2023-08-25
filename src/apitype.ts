export type APIUser = {
    id: number;
    name: string;
    email: string;
};

export type APIBook = {
    book_id: string;
    name: string;
    year: number;
    created_at: string;
    updated_at: string;
}

export type APIAccountTitle = {
   title_id: number;
    book_id: string;
    name: string;
    amount: number;
    amount_base: number;
    type: number;
    created_at: string;
    updated_at: string;
}