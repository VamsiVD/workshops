# Architecture

## Overview

Serverless three-tier app. The browser loads a static React app, which calls a JSON API. One Lambda function handles every route and persists to MongoDB.

```
 Browser (React + Vite)
        |
        |  HTTPS  (fetch, JSON)
        v
 Amazon API Gateway (HTTP API)  --  CORS enabled
        |
        |  Lambda proxy integration (payload v2.0)
        v
 AWS Lambda (Python)  <-- Lambda layer: pymongo, bson, dnspython
        |
        |  MongoDB wire protocol (TLS, MONGO_URI)
        v
 MongoDB  (database: noticeboard_db, collection: notices)
```

## Components

| Component     | Location          | Responsibility |
|---------------|-------------------|----------------|
| Frontend      | `web-app/`        | Lists notices, creates and deletes them via `fetch`. Single `App.jsx` component with local state. |
| API Gateway   | AWS               | Public HTTPS endpoint. Routes 5 method/path pairs to the Lambda and adds CORS headers for preflight. |
| Lambda        | `backend/lambda_function.py` | Routing by HTTP method and `{id}` path parameter, request parsing, MongoDB CRUD, JSON responses. |
| Lambda layer  | `pymongo-layer/`  | Ships `pymongo`, `bson`, `dns` so the function zip stays small. |
| MongoDB       | External (e.g. Atlas) | Stores documents. Connection string comes from the `MONGO_URI` environment variable. |

## Data model

Collection `notices`:

```json
{
  "_id": "ObjectId (returned to clients as a string)",
  "title": "string (default 'Untitled')",
  "content": "string (default '')"
}
```

## Request flow

1. React calls `GET/POST/PUT/DELETE {API_URL}/notices[/{id}]`.
2. API Gateway invokes the Lambda with an event containing `requestContext.http.method`, `pathParameters.id` and a JSON string `body`.
3. The handler picks a branch:
   - `GET` without id: list all
   - `GET` with id: find one (404 if absent)
   - `POST`: insert, return 201 with the new document
   - `PUT` with id: `$set` of provided `title` / `content`
   - `DELETE` with id: delete one
   - anything else: 400
4. Any exception becomes a 500 with `{ "error": message }`.
5. Every response carries `Content-Type: application/json` and `Access-Control-Allow-Origin: *`.

## Design decisions

- **One Lambda for all routes**: simple to deploy for an MVP; the handler is small enough that splitting per route adds no value yet.
- **Client created outside the handler**: `MongoClient` is reused across warm invocations, avoiding a new connection per request.
- **Lambda layer for pymongo**: pymongo has native extensions that must be built for Lambda's Linux runtime; packaging it once as a layer keeps function deploys fast.
- **Secrets in environment variables**: `MONGO_URI` is never committed.
- **ObjectId to string in the handler**: `bson.ObjectId` is not JSON serializable.

## Security and limitations

- CORS is open (`*`) and there is no authentication or authorization. Acceptable for a workshop MVP, not for production.
- Input is not validated (types, lengths). Malformed ids surface as 500.
- No pagination, search or sorting.

## Path to the full NoticeBoardTracker

The business brief needs more than notice CRUD. Suggested next steps:

1. **Auth and roles**: Cognito or JWT with roles HR, Training Manager, Trainee.
2. **Collections**: `trainees`, `cohorts`, `plans`, `progress_reports`, `notifications` (unique index on trainee email to stop duplicates).
3. **Notifications**: publish an event (SNS or SES email) when a plan is assigned or a notice is posted.
4. **Dashboard endpoint**: aggregation over `progress_reports` per cohort for managers.
5. **Frontend**: role-based pages (onboarding form, plan view, progress submission, manager dashboard).
