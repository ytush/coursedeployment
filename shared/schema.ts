import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (creators and learners)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: text("wallet_address").unique(),
  isCreator: boolean("is_creator").default(false),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Courses table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  coverImageUrl: text("cover_image_url"),
  previewVideoUrl: text("preview_video_url"),
  category: text("category").notNull(),
  creatorId: integer("creator_id").notNull(),
  price: text("price").notNull(), // Stored as string for ETH values
  duration: text("duration").notNull(), // Total duration of the course
  lectureCount: integer("lecture_count").notNull(),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  nftContract: text("nft_contract"), // Will be filled when NFT is minted
});

// Course content (sections and lectures)
export const courseSections = pgTable("course_sections", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  title: text("title").notNull(),
  order: integer("order").notNull(),
});

export const courseLectures = pgTable("course_lectures", {
  id: serial("id").primaryKey(),
  sectionId: integer("section_id").notNull(),
  title: text("title").notNull(),
  videoUrl: text("video_url"),
  duration: text("duration").notNull(), // Duration of this specific lecture
  order: integer("order").notNull(),
  resources: jsonb("resources"), // Downloadable resources
});

// NFT ownership and temporary sharing
export const nftOwnership = pgTable("nft_ownership", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  ownerId: integer("owner_id").notNull(),
  tokenId: text("token_id").notNull(),
  mintedAt: timestamp("minted_at").defaultNow(),
  transactionHash: text("transaction_hash"),
});

export const temporaryAccess = pgTable("temporary_access", {
  id: serial("id").primaryKey(),
  ownershipId: integer("ownership_id").notNull(),
  recipientAddress: text("recipient_address").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Access requests for temporary access
export const accessRequests = pgTable("access_requests", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  requesterAddress: text("requester_address").notNull(),
  ownerAddress: text("owner_address").notNull(),
  requestMessage: text("request_message"),
  requestDuration: integer("request_duration").notNull(), // Duration in days
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Course ratings and reviews
export const courseRatings = pgTable("course_ratings", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  userId: integer("user_id").notNull(),
  rating: integer("rating").notNull(), // Rating from 1-5
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Zod schemas for data validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  walletAddress: true,
  isCreator: true,
  bio: true,
  avatarUrl: true,
});

export const insertCourseSchema = createInsertSchema(courses).pick({
  title: true,
  description: true,
  coverImageUrl: true,
  previewVideoUrl: true,
  category: true,
  creatorId: true,
  price: true,
  duration: true,
  lectureCount: true,
  isPublished: true,
});

export const insertSectionSchema = createInsertSchema(courseSections).pick({
  courseId: true,
  title: true,
  order: true,
});

export const insertLectureSchema = createInsertSchema(courseLectures).pick({
  sectionId: true,
  title: true,
  videoUrl: true,
  duration: true,
  order: true,
  resources: true,
});

export const insertNftOwnershipSchema = createInsertSchema(nftOwnership).pick({
  courseId: true,
  ownerId: true,
  tokenId: true,
  transactionHash: true,
});

export const insertTemporaryAccessSchema = createInsertSchema(temporaryAccess).pick({
  ownershipId: true,
  recipientAddress: true,
  expiresAt: true,
});

export const insertCourseRatingSchema = createInsertSchema(courseRatings).pick({
  courseId: true,
  userId: true,
  rating: true,
  review: true,
});

export const insertAccessRequestSchema = createInsertSchema(accessRequests).pick({
  courseId: true,
  requesterAddress: true,
  ownerAddress: true,
  requestMessage: true,
  requestDuration: true,
  status: true,
});

// Types for our schemas
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type InsertSection = z.infer<typeof insertSectionSchema>;
export type InsertLecture = z.infer<typeof insertLectureSchema>;
export type InsertNftOwnership = z.infer<typeof insertNftOwnershipSchema>;
export type InsertTemporaryAccess = z.infer<typeof insertTemporaryAccessSchema>;
export type InsertCourseRating = z.infer<typeof insertCourseRatingSchema>;
export type InsertAccessRequest = z.infer<typeof insertAccessRequestSchema>;

export type User = typeof users.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type CourseSection = typeof courseSections.$inferSelect;
export type CourseLecture = typeof courseLectures.$inferSelect;
export type NftOwnership = typeof nftOwnership.$inferSelect;
export type TemporaryAccess = typeof temporaryAccess.$inferSelect;
export type CourseRating = typeof courseRatings.$inferSelect;
export type AccessRequest = typeof accessRequests.$inferSelect;

// Extended type for course with sections and lectures
export type CourseWithContent = Course & {
  creator: User;
  sections: (CourseSection & {
    lectures: CourseLecture[];
  })[];
  ratings?: (CourseRating & {
    user: User;
  })[];
  averageRating?: number;
  totalRatings?: number;
};
