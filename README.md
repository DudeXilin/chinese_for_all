# CHINESE FOR ALL

A Next.js application for learning Chinese with Supabase authentication and user data management.

## Authentication and User Data

User authentication is handled by [Supabase Auth](https://supabase.com/auth).

Supabase Auth securely manages:

- user accounts
- emails
- encrypted passwords
- authentication sessions
- unique user IDs (UIDs)

The application never stores passwords in the GitHub repository.

## User Database Structure

User-related application data is stored separately from authentication data.

The database structure is located here:

```
supabase/profile-schema.sql
```

This file contains the database schema for user profiles, learning progress, and settings.

The application uses the Supabase Auth UID as the unique identifier that connects all user data.

Example:

```
Supabase Auth
      |
      | UID
      ↓
profiles
      |
      ├── nickname
      ├── avatar
      └── profile information

learning_progress
      |
      ├── HSK level
      ├── learned words
      └── completed lessons

user_settings
      |
      └── personal preferences
```

## Database Security

Supabase Row Level Security (RLS) is enabled for user tables.

This means each user can only access their own data connected to their UID.

The GitHub repository contains only the application code and database structure. Private user information remains inside Supabase.

## Technologies

- [Next.js](https://nextjs.org/) - application framework
- [Supabase](https://supabase.com/) - authentication and database
- [Vercel](https://vercel.com/) - deployment platform
