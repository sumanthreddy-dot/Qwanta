import axios from 'axios';
import {
  Vessel, CargoDemand, CandidateRoute, OptimizationRequest, OptimizationResult,
  FuelPredictionInput, FuelPredictionOutput, BenchmarkResponse, ScalabilityRecord,
  AnalyticsResponse, FuelPredictionRecord, RouteRecord
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const fleetApi = {
  getHealth: async () => {
    const res = await api.get('/health');
    return res.data;
  },

  getFleet: async (): Promise<Vessel[]> => {
    const res = await api.get('/fleet');
    return res.data;
  },

  addVessel: async (vessel: Vessel): Promise<Vessel> => {
    const res = await api.post('/fleet', vessel);
    return res.data;
  },

  deleteVessel: async (vesselId: string): Promise<{ message: string }> => {
    const res = await api.delete(`/fleet/${vesselId}`);
    return res.data;
  },

  getDemands: async (): Promise<CargoDemand[]> => {
    const res = await api.get('/demands');
    return res.data;
  },

  addDemand: async (demand: CargoDemand): Promise<CargoDemand> => {
    const res = await api.post('/demands', demand);
    return res.data;
  },

  getPorts: async () => {
    const res = await api.get('/ports');
    return res.data;
  },

  getCorridors: async () => {
    const res = await api.get('/corridors');
    return res.data;
  },

  getCandidateRoutes: async (origin = 'SHA', destination = 'RTM'): Promise<CandidateRoute[]> => {
    const res = await api.get('/routes/candidates', { params: { origin, destination } });
    return res.data;
  },

  predictFuel: async (inputData: FuelPredictionInput): Promise<FuelPredictionOutput> => {
    const res = await api.post('/predict-fuel', inputData);
    return res.data;
  },

  getModelMetrics: async () => {
    const res = await api.get('/model-metrics');
    return res.data;
  },

  runOptimization: async (req: OptimizationRequest): Promise<OptimizationResult> => {
    const res = await api.post('/optimize', req);
    return res.data;
  },

  getOptimization: async (id: string): Promise<OptimizationResult> => {
    const res = await api.get(`/optimization/${id}`);
    return res.data;
  },

  runBenchmark: async (): Promise<BenchmarkResponse> => {
    const res = await api.post('/benchmark');
    return res.data;
  },

  getScalability: async (): Promise<ScalabilityRecord[]> => {
    const res = await api.get('/scalability');
    return res.data;
  },

  getAnalytics: async (): Promise<AnalyticsResponse> => {
    const res = await api.get('/analytics');
    return res.data;
  },

  getExplainability: async (vesselId: string) => {
    const res = await api.get(`/explainability/${vesselId}`);
    return res.data;
  },

  getPredictionHistory: async (vesselId?: string, limit = 50): Promise<FuelPredictionRecord[]> => {
    const res = await api.get('/prediction-history', { params: { vessel_id: vesselId, limit } });
    return res.data;
  },

  getRoutes: async (): Promise<RouteRecord[]> => {
    const res = await api.get('/routes');
    return res.data;
  },

  createRoute: async (route: RouteRecord): Promise<RouteRecord> => {
    const res = await api.post('/routes', route);
    return res.data;
  },

  /** All 9 ML models with dynamic ranking from benchmark metrics */
  getModels: async () => {
    const res = await api.get('/models');
    return res.data;
  },

  /** Query the 270-row CSV scenarios with optional filters */
  getScenarioPredictions: async (params: {
    vessel_type?: string;
    weather?: string;
    fuel?: string;
    speed?: number;
    limit?: number;
  } = {}) => {
    const res = await api.get('/predictions', { params });
    return res.data;
  },

  /** Build QUBO matrix and return heatmap + statistics */
  buildQubo: async (req: OptimizationRequest) => {
    const res = await api.post('/qubo/build', req);
    return res.data;
  },

  /** Update an existing vessel in the registry */
  updateVessel: async (vesselId: string, vessel: Vessel): Promise<Vessel> => {
    const res = await api.put(`/fleet/${vesselId}`, vessel);
    return res.data;
  },
};
