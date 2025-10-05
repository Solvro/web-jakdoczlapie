import { z } from "zod";

// GeoJSON Point type
export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Condition schema
export const conditionSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Condition = z.infer<typeof conditionSchema>;

// Schedule schema
export const scheduleSchema = z.object({
  id: z.number(),
  time: z.string(),
  sequence: z.number().optional(),
  destination: z.string().optional(),
  conditions: z.array(conditionSchema).optional(),
  route_stop_id: z.number().optional(),
  run: z.number().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Schedule = z.infer<typeof scheduleSchema>;

// Stop schema
export const stopSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.enum(['bus', 'train', 'tram']).optional(),
  location: z.any().optional(), // GeoJSONPoint
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  schedules: z.array(scheduleSchema).optional(),
  routes: z.array(z.any()).optional(),
  distance: z.number().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Stop = z.infer<typeof stopSchema>;

// Route Stop schema
export const routeStopSchema = z.object({
  id: z.number(),
  route_id: z.number(),
  stop_id: z.number(),
  stop: stopSchema.optional(),
  schedules: z.array(scheduleSchema).optional(),
});

export type RouteStop = z.infer<typeof routeStopSchema>;

// Route schema
export const routeSchema = z.object({
  id: z.number(),
  name: z.string(),
  operator: z.string().optional(),
  type: z.enum(['bus', 'train', 'tram']).optional(),
  stops: z.array(stopSchema).optional(),
  route_stops: z.array(routeStopSchema).optional(),
  schedules: z.array(scheduleSchema).optional(),
  destinations: z.array(z.string()).optional(),
  run: z.number().optional(),
  departure: z.object({
    name: z.string(),
    id: z.number(),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }),
    time: z.string(),
  }).optional(),
  arrival: z.object({
    name: z.string(),
    id: z.number(),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }),
    time: z.string(),
  }).optional(),
  travel_time: z.number().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Route = z.infer<typeof routeSchema>;

// Report types
export const reportTypes = [
  'delay',
  'accident',
  'press',
  'failure',
  'did_not_arrive',
  'change',
  'other',
  'diffrent_stop_location',
  'request_stop',
] as const;

export type ReportType = typeof reportTypes[number];

// Report schema
export const reportSchema = z.object({
  id: z.number(),
  run: z.number().optional(),
  route_id: z.number().optional(),
  type: z.enum(reportTypes).optional(),
  description: z.string().optional(),
  location: z.any().optional(), // GeoJSONPoint
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  image: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Report = z.infer<typeof reportSchema>;

// Create report input schema
export const createReportSchema = z.object({
  run: z.number().optional(),
  type: z.enum(reportTypes),
  description: z.string().max(255).optional(),
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  image: z.number().optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

// Track schema
export const trackSchema = z.object({
  id: z.number(),
  created_at: z.string(),
  route_id: z.number(),
  run: z.number(),
  location: z.any().optional(), // GeoJSONPoint
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  route: routeSchema.optional(),
});

export type Track = z.infer<typeof trackSchema>;

// Route search result
export const routeSearchResultSchema = z.object({
  departure: z.object({
    name: z.string(),
    id: z.number(),
    coordinates: z.object({
      longitude: z.number(),
      latitude: z.number(),
    }),
    time: z.string(),
    distance: z.number(),
  }),
  arrival: z.object({
    name: z.string(),
    id: z.number(),
    coordinates: z.object({
      longitude: z.number(),
      latitude: z.number(),
    }),
    time: z.string(),
    distance: z.number(),
  }),
  travel_time: z.number(),
  transfers: z.number(),
  routes: z.array(routeSchema),
});

export type RouteSearchResult = z.infer<typeof routeSearchResultSchema>;

// Operator schema
export const operatorSchema = z.string();

export type Operator = z.infer<typeof operatorSchema>;
