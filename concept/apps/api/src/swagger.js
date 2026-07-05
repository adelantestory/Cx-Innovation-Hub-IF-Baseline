// =============================================================================
// Swagger / OpenAPI Configuration
// =============================================================================
// Generates the OpenAPI 3.0 spec from JSDoc annotations across all route files.
// Served at /api/docs (UI) and /api/docs.json (raw spec).
// =============================================================================

const swaggerJsdoc = require("swagger-jsdoc");
const path = require("path");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Taskify API",
      version: "1.0.0",
      description:
        "REST API for the Taskify Kanban board application. Manage projects, tasks, users, and comments.",
      contact: {
        name: "Taskify Team",
      },
    },
    servers: [
      {
        url: "/api",
        description: "API base path",
      },
    ],
    components: {
      parameters: {
        XUserId: {
          in: "header",
          name: "X-User-Id",
          schema: { type: "string", format: "uuid" },
          required: true,
          description: "UUID of the acting user (used for comment authorship).",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                status: { type: "integer", example: 400 },
                message: { type: "string", example: "Validation failed" },
              },
            },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", example: "Alice" },
            role: { type: "string", example: "developer" },
            avatar_color: { type: "string", example: "#4A90D9" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        Project: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", example: "Website Redesign" },
            description: { type: "string", example: "Full redesign of the company website" },
            task_count: { type: "integer", example: 12 },
            done_count: { type: "integer", example: 5 },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        Task: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            project_id: { type: "string", format: "uuid" },
            title: { type: "string", example: "Implement login page" },
            description: { type: "string", example: "Build the login page UI and hook up auth" },
            status: {
              type: "string",
              enum: ["todo", "in_progress", "in_review", "done"],
              example: "todo",
            },
            position: { type: "integer", example: 0 },
            assigned_user_id: { type: "string", format: "uuid", nullable: true },
            assigned_user_name: { type: "string", nullable: true, example: "Alice" },
            assigned_user_avatar_color: { type: "string", nullable: true, example: "#4A90D9" },
            parent_task_id: { type: "string", format: "uuid", nullable: true },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        Comment: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            task_id: { type: "string", format: "uuid" },
            user_id: { type: "string", format: "uuid" },
            parent_comment_id: { type: "string", format: "uuid", nullable: true },
            content: { type: "string", example: "Looks good to me!" },
            author_name: { type: "string", example: "Alice" },
            author_avatar_color: { type: "string", example: "#4A90D9" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        TaskJob: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            task_id: { type: "string", format: "uuid" },
            project_id: { type: "string", format: "uuid" },
            job_type: { type: "string", example: "decompose" },
            status: {
              type: "string",
              enum: ["pending", "running", "completed", "failed"],
              example: "pending",
            },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
      },
    },
  },
  apis: [
    path.join(__dirname, "routes", "*.js"),
    path.join(__dirname, "index.js"),
  ],
};

module.exports = swaggerJsdoc(options);
