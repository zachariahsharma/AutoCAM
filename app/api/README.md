## User Routes
- /api/teams - POST - Create a team (only if email is verified)
- /api/teams - GET - Get all teams
- /api/teams/:id - PATCH - Update team details (only if admin and email is verified)
- /api/teams/:id - DELETE - DELETE team (only if admin and email is verified)
- /api/teams/:id/invite - POST - Invite email (in body) to team (only if admin and email is verified)
- /api/teams/accept/:id - GET - Accept invite sent to email (must be signed in as the same user as the invite)
- /api/teams/:id/keys - POST - Create an API key (only if admin and email is verified)
- /api/keys/:id - PATCH - Update details of key (name) (only if admin and email is verified)
- /api/keys/:id - DELETE - Delete key (only if admin and email is verified)
- /api/teams/:id/pc - POST - Create a part category (everybody on team with verified email)
- /api/teams/:id/pc - GET - Get all part categories (everybody on team)
- /api/user/invites - GET - Get all invites for a user

## API Key Routes
- /api/teams - PATCH - Update team details
- /api/teams - GET - Get team details
- /api/teams/invite - POST - Invite email (in body) to team
- /api/pc - POST - Create a part category
- /api/pc - GET - Get all part categories

## Common Routes
- /api/pc/:id - DELETE - Delete a part category (everybody on team with verified email)
- /api/pc/:id - PATCH - Update a part category (everybody on team with verified email)
- /api/pc/:id/parts - POST - Create a part (everybody on team with verified email)
- /api/pc/:id/parts - GET - Get all parts (everybody on team)
- /api/pc/:id/plates - POST - Create a plates (everybody on team with verified email)
- /api/pc/:id/plates - GET - Get all plates (everybody on team)
- /api/parts/:id - DELETE - Delete a part (everybody on team with verified email)
- /api/parts/:id - PATCH - Update a part (everybody on team with verified email)
- /api/plates/:id - DELETE - Delete a plate (everybody on team with verified email)
- /api/plates/:id - PATCH - Update a plate (everybody on team with verified email)

## API Key Scopes
- teams:read - Able to read details about the teams that the key is assigned to
- team:invites:read - Able to read outgoing invites
- team:invites:send - Able to send invites
- team:invites:cancel - Able to cancel invites
- part_categories:read - Able to read part categories
- part_categories:write - Able to INSERT, UPDATE, and DELETE part categories
- parts:read - Able to read parts
- parts:write - Able to INSERT, UPDATE, and DELETE parts
- plates:read - Able to read plates
- plates:write - Able to INSERT, UPDATE, and DELETE plates