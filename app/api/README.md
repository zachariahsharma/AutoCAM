## User Routes
- /api/teams - POST - Create a team (only if email is verified)
- /api/teams - GET - Get all teams
- /api/teams/:id - PATCH - Update team details (only if admin and email is verified)
- /api/teams/:id - DELETE - DELETE team (only if admin and email is verified)
- /api/teams/:id/invite - POST - Invite email (in body) to team (only if admin and email is verified)
- /api/teams/accept/:id - GET - Accept invite sent to email (must be signed in as the same user as the invite)
- /api/teams/:id/keys - POST - Create an API key (only if admin and email is verified)
- /api/teams/:id/keys/:key - PATCH - Update details of key (name) (only if admin and email is verified)
- /api/teams/:id/keys/:key - DELETE - Delete key (only if admin and email is verified)
- /api/teams/:id/pc - POST - Create a part category (everybody on team)
- /api/teams/:id/pc - GET - Get all part categories (everybody on team)
- /api/pc/:id - DELETE - Delete a part category (everybody on team)
- /api/pc/:id - PATCH - Update a part category (everybody on team)

## API Key Routes
- /api/teams - PATCH - Update team details
- /api/teams - GET - Get team details
- /api/teams/invite - POST - Invite email (in body) to team
- /api/pc - POST - Create a part category
- /api/pc - GET - Get all part categories
- /api/pc/:id - DELETE - Delete a part category
- /api/pc/:id - PATCH - Update a part category