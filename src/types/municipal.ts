export interface MunicipalTeam {
  id: string
  name: string
  domain: string
  categories: import('./issue').IssueCategory[]
}

export interface Ward {
  id: string
  name: string
  neighborhoods: string[]
}

export interface DemoUser {
  id: string
  name: string
  role: 'citizen' | 'officer'
  title?: string
}
