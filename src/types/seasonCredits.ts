export interface SeasonCastMember {
  adult: boolean;
  gender: number;
  id: number;
  known_for_department: string;
  name: string;
  original_name: string;
  popularity: number;
  profile_path: string | null;
  roles: Array<{
    credit_id: string;
    character: string;
    episode_count: number;
  }>;
  total_episode_count: number;
  order: number;
}

export interface SeasonCrewMember {
  adult: boolean;
  gender: number;
  id: number;
  known_for_department: string;
  name: string;
  original_name: string;
  popularity: number;
  profile_path: string | null;
  jobs: Array<{
    credit_id: string;
    job: string;
    episode_count: number;
  }>;
  department: string;
  total_episode_count: number;
}

export interface SeasonAggregateCreditsResponse {
  cast: SeasonCastMember[];
  crew: SeasonCrewMember[];
  id: number;
}
