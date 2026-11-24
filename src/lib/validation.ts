import { z } from 'zod'
import { isWithinDelhiBounds } from './geo'

export const reportIssueSchema = z.object({
  reporterName: z.string().trim().min(2, 'Enter your name').max(80, 'Keep the name under 80 characters'),
  category: z.enum([
    'pothole', 'garbage', 'streetlight', 'waterlogging', 'drainage',
    'water_supply', 'infrastructure', 'other',
  ]),
  title: z.string().trim().min(6, 'Title must be at least 6 characters').max(100, 'Keep the title under 100 characters'),
  description: z.string().trim().min(20, 'Add at least 20 characters describing the issue').max(800, 'Keep the description under 800 characters'),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  lat: z.number().refine((lat) => lat >= -90 && lat <= 90, 'Invalid latitude'),
  lng: z.number().refine((lng) => lng >= -180 && lng <= 180, 'Invalid longitude'),
}).refine((data) => isWithinDelhiBounds(data.lat, data.lng), {
  message: 'Selected location falls outside the Delhi demo coverage area. Please pick a point within Delhi.',
  path: ['lat'],
})

export type ReportIssueInput = z.infer<typeof reportIssueSchema>

export const MAX_PHOTO_SIZE_BYTES = 4 * 1024 * 1024 // 4MB
export const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function validatePhotoFile(file: File): string | null {
  if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
    return 'Please upload a JPEG, PNG, or WEBP image.'
  }
  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    return 'Image is too large. Please upload a photo under 4MB.'
  }
  return null
}
