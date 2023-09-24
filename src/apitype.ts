export type APIUser = {
    id: string;
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

export type APITransaction = {
    transaction_id: number;
    book_id: string;
    description: string;
    sub_transactions: APISubTransaction[];
    occurred_at: string;
    created_at: string;
    updated_at: string;
}

export type APISubTransaction = {
    sub_transaction_id: number;
    is_debit: boolean;
    account_title_id: number;
    account_title: APIAccountTitle;
    amount: number;
    created_at: string;
    updated_at: string;
}

export type APIBookAuthorization = {
    book_id: string;
    user_id: string;
    authority: string;
    created_at: string;
    updated_at: string;
}