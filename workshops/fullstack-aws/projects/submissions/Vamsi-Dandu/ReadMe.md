# NoticeBoard

A small full-stack notice board: a React frontend talks to a serverless REST API (API Gateway + AWS Lambda) that stores notices in MongoDB.

This is the Version 1 (MVP) of the NoticeBoardTracker brief in
[`BusinessRequirement.md`](../../02-notice-board-Friday_Weekend_Challenge/BusinessRequirement.md). It covers notice CRUD only. Trainee onboarding, cohorts, progress reports and the manager dashboard are not built yet.

## Folder layout

```
Vamsi-Dandu/
├── web-app/          React + Vite frontend
├── backend/          AWS Lambda function (Python) + requirements
├── pymongo-layer/    pymongo/bson/dnspython packaged as a Lambda layer
├── postmanscript/    Postman collection for API tests
├── Architecture.md   Design and request flow
└── ReadMe.md
```

## API

Base URL: `https://74jaiumpab.execute-api.us-east-2.amazonaws.com`

| Method | Path             | Body                          | Success            | Notes                        |
|--------|------------------|-------------------------------|--------------------|------------------------------|
| GET    | `/notices`       | -                             | 200, array         | All notices                  |
| GET    | `/notices/{id}`  | -                             | 200, notice        | 404 if not found             |
| POST   | `/notices`       | `{ "title", "content" }`      | 201, created notice| Missing title becomes `Untitled` |
| PUT    | `/notices/{id}`  | `{ "title"?, "content"? }`    | 200, message       | Send at least one field      |
| DELETE | `/notices/{id}`  | -                             | 200, message       |                              |

Errors return `{ "error": "..." }` with status 400 (unsupported route) or 500 (unexpected error, e.g. malformed id).

## Run the frontend

```bash
cd web-app
npm install
npm run dev
```

The API URL is set in `web-app/App.jsx` (`API_URL`).

## Deploy the backend (AWS console)

1. **Layer**: in Lambda, create a layer from `pymongo-layer/pymongo-layer.zip` (Python 3.12 or the runtime you use). The zip must contain a top-level `python/` folder.
2. **Function**: create a Lambda (Python) and paste in `backend/lambda_function.py`. Handler: `lambda_function.lambda_handler`. Attach the layer.
3. **Environment variable**: `MONGO_URI` = your MongoDB connection string (for example a MongoDB Atlas URI). Atlas must allow connections from Lambda (IP allow list).
4. **API Gateway (HTTP API)**: create routes `GET /notices`, `POST /notices`, `GET /notices/{id}`, `PUT /notices/{id}`, `DELETE /notices/{id}`, all integrated with the Lambda. Enable CORS (origin `*`, methods `GET,POST,PUT,DELETE,OPTIONS`, header `Content-Type`).
5. Put the API invoke URL into `web-app/App.jsx` and into the Postman `base_url` variable.

The handler reads `event.requestContext.http.method`, so it expects the HTTP API (payload format 2.0), not a REST API.

## Test with Postman

1. Open the `postmanscript/NoticeBoard API` folder as a collection in Postman (it uses Postman's YAML folder format, one file per request; the Postman VS Code extension reads it directly).
2. Set the collection variable `base_url` if your API URL differs.
3. Run the collection in the Collection Runner. Requests run in order: create, list, get, update, get, delete, get (404). The created id is shared through the `notice_id` variable.

## Known limitations

- No authentication. Anyone with the URL can create and delete notices.
- `PUT` with a body that has neither `title` nor `content` returns 500 (empty `$set`).
- A malformed `{id}` returns 500 instead of 400.
- Full-collection `GET /notices` has no pagination or filtering.
