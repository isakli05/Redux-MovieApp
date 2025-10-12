export interface MovieCredit {
    adult: boolean;
    backdrop_path?: string;
    genre_ids: number[];
    id: number;
    original_language: string;
    original_title: string;
    overview: string;
    popularity: number;
    poster_path?: string;
    release_date: string;
    title: string;
    video: boolean;
    vote_average: number;
    vote_count: number;
    character?: string;
    credit_id: string;
    order?: number;
}

export interface TvCredit {
    adult: boolean;
    backdrop_path?: string;
    genre_ids: number[];
    id: number;
    origin_country: string[];
    original_language: string;
    original_name: string;
    overview: string;
    popularity: number;
    poster_path?: string;
    first_air_date: string;
    name: string;
    vote_average: number;
    vote_count: number;
    character?: string;
    credit_id: string;
    episode_count?: number;
}

export interface PersonMovieCredits {
    cast: MovieCredit[];
    crew: MovieCredit[];
}

export interface PersonTvCredits {
    cast: TvCredit[];
    crew: TvCredit[];
}

export interface PersonDetail {
    birthday: string;
    known_for_department: string;
    deathday?: any;
    id: number;
    name: string;
    also_known_as: string[];
    gender: number;
    biography: string;
    popularity: number;
    place_of_birth: string;
    profile_path: string;
    adult: boolean;
    imdb_id: string;
    homepage?: any;
    movie_credits?: PersonMovieCredits;
    tv_credits?: PersonTvCredits;
}
