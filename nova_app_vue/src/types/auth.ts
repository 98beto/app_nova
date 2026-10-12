export type UserRole = 'user' | 'developer' | 'admin'

export interface DeveloperProfile {
  company_name: string
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  activated_at: string | null
}

export interface User {
  id: number
  name: string
  email: string
  avatar_url: string | null
  gender: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say'
  birth_date: string
  role: UserRole
  status: 'active' | 'suspended' | 'disabled'
  developer_profile?: DeveloperProfile
}

export interface ApiResponse<T> {
  message: string
  data: T
}

export interface LoginPayload {
  email: string
  password: string
  remember: boolean
}

export interface RegisterPayload {
  name: string
  email: string
  gender: User['gender']
  birth_date: string
  password: string
  password_confirmation: string
  role: Exclude<UserRole, 'admin'>
  company_name: string
  avatar: File | null
}
