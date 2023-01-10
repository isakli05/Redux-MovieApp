import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
//import { getUpcomingMoviesAsync } from "../services";
import { Movies } from "../../types/Movies";
import axios from "axios";
import { current } from "@reduxjs/toolkit";

interface UpcomingMoviesState {
  data: Movies | undefined;
  loading: "idle" | "pending" | "fulfilled" | "rejected";
  error: string;
  page: number;
}

const initialState: UpcomingMoviesState = {
  data: undefined,
  loading: "idle",
  error: "",
  page: 1,
};

export const fetchUpcomingMovies = createAsyncThunk(
  "fetchUpcomingMovies",
  async (page?: number) => {
    const res = await axios<Movies>(
      `https://api.themoviedb.org/3/movie/upcoming?api_key=a005a803cdec9237f52c2801d1f28661&language=tr-TR&page=${page}`
    );
    return res.data;
  }
);

export const upcomingMoviesSlice = createSlice({
  name: "upcomingMovies",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    //fetch Upcoming Playing Movies
    builder.addCase(fetchUpcomingMovies.pending, (state, action) => {
      state.loading = "pending";
      state.error = "";
    });
    builder.addCase(
      fetchUpcomingMovies.fulfilled,
      (state, action: PayloadAction<Movies>) => {
        state.data = { ...current(state), ...action.payload };
        state.loading = "fulfilled";
        state.page++;
      }
    );
    builder.addCase(fetchUpcomingMovies.rejected, (state, action) => {
      state.error = "error fetching data";
      state.loading = "rejected";
    });
  },
});

export default upcomingMoviesSlice.reducer;