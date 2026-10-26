/** Shared API bundles and page-specific Inertia props (without shared auth/errors props). */
export type PageMeta = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

export type Page<T> = { data: T[]; meta: PageMeta };

export type Category = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
};

export type StoreApplication = {
    id: number;
    slug: string;
    name: string;
    description: string;
    icon_url: string | null;
    minimum_age: number;
    /** Decimal string, never a client-calculated payment amount. */
    price: string;
    is_free: boolean;
    status:
        | 'draft'
        | 'pending_review'
        | 'approved'
        | 'rejected'
        | 'unpublished';
    published_at: string | null;
    category: Pick<Category, 'id' | 'name' | 'slug'>;
    /** id is developer_profiles.id, not users.id. */
    developer: { id: number; company_name: string };
    screenshots: { position: number; url: string }[];
    downloads_count: number;
    trending_downloads_count: number;
    reviews_count: number;
    average_rating: number | null;
    installed: boolean;
};

export type StoreReview = {
    id: number;
    application_id: number;
    author: { id: number; name: string; avatar_url: string | null };
    rating: number;
    body: string | null;
    likes_count: number;
    liked: boolean;
    is_own: boolean;
    created_at: string | null;
    updated_at: string | null;
};

/** GET /store; GET /api/v1/applications. Query free accepts 0/1, not "true"/"false". */
export type CatalogueBundle = {
    applications: Page<StoreApplication>;
    categories: Category[];
    /** Home discovery only (no search/category/free filter; newest sort). Up to four, ranked by all-time downloads. */
    popular?: StoreApplication[];
    /** Same home context. Up to four, ranked by downloads within the rolling last seven days. */
    trending?: StoreApplication[];
    filters: {
        search: string;
        category: string | null;
        free: boolean | null;
        sort: 'newest' | 'rating' | 'downloads' | 'trending';
    };
};

/** store/Show; GET /api/v1/applications/{id}; review PUT and publication POST responses. */
export type ApplicationDetailBundle = {
    application: StoreApplication;
    reviews: Page<StoreReview>;
    own_review: StoreReview | null;
    similar: StoreApplication[];
    same_developer: StoreApplication[];
};

/** developer/Dashboard; GET /api/v1/developer/applications. */
export type DeveloperBundle = {
    applications: Page<StoreApplication>;
    categories: Category[];
    summary: {
        applications_count: number;
        published_count: number;
        downloads_count: number;
        reviews_count: number;
        average_rating: number | null;
    };
};

/** developer/Show; GET /api/v1/developer/applications/{id}. */
export type DeveloperApplicationBundle = {
    application: StoreApplication;
    categories: Category[];
};

export type StoreProfile = {
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
    gender: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
    birth_date: string;
    role: 'user' | 'developer';
    status: 'active' | 'suspended' | 'disabled';
    developer_profile?: {
        company_name: string | null;
        payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | null;
        activated_at: string | null;
    };
};

/** profile/Show; profile GET/PATCH responses. Reviews paginate with reviews_page. */
export type ProfileBundle = {
    profile: StoreProfile;
    reviews: Page<StoreReview>;
    summary: { downloads_count: number; reviews_count: number };
};

/** library/Index; GET /api/v1/library. Paginated with library_page, 12 rows per page. */
export type LibraryBundle = {
    library: Page<{
        id: number;
        application_id: number;
        downloaded_at: string;
        application: StoreApplication | null;
        available: boolean;
    }>;
    summary: { downloads_count: number };
};

/** POST /applications/{id}/downloads returns 200 for both initial and repeated install. */
export type InstallBundle = ApplicationDetailBundle & {
    download: { id: number; application_id: number; downloaded_at: string };
};

/** multipart/form-data; screenshots[] is exactly four raster images; no binary upload. */
export type PublicationInput = {
    name: string;
    description: string;
    category_id: number;
    minimum_age: number;
    price: string;
    icon: File;
    screenshots: [File, File, File, File];
};

/** All fields optional; use POST + _method=PATCH for multipart avatar uploads. */
export type ProfileInput = Partial<{
    name: string;
    email: string;
    gender: StoreProfile['gender'];
    birth_date: string;
    avatar: File;
    /** Developers only. */
    company_name: string;
}>;

export type ReviewInput = { rating: number; body?: string | null };
export type LikeInput = {
    liked: boolean;
    /** Positive page number preserved by web redirects; accepted in body or query. */
    reviews_page?: number;
};
export type LikeBundle = { review: StoreReview };

/** API: 422 includes errors; 401/403/404 return message. Web forms redirect with Inertia errors. */
export type StoreApiError = {
    message: string;
    errors?: Record<string, string[]>;
};
