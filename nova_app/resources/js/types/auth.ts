export type User = {
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
    gender: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
    birth_date: string;
    role: 'user' | 'developer' | 'admin';
    status: 'active' | 'suspended' | 'disabled';
};

export type Auth = {
    user: User | null;
};
