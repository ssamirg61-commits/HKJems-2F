# Vercel Deployment Setup

## Required Environment Variables

Add these to your Vercel project: **Settings → Environment Variables**

### Required:
```
MONGODB_URI=mongodb+srv://ssamirg61_db_user:VtnpFaC2PZYuQasl@hkjems.6gksxdq.mongodb.net/
MONGODB_DB=hkjems
JWT_SECRET=hkjems_secret_key_2026_production_use_stronger_in_real_deployment
```

### Optional:
```
WEBHOOK_URL=your_webhook_url_for_email_notifications
PING_MESSAGE=ping pong
```

## MongoDB Atlas Setup

1. Go to MongoDB Atlas → Network Access
2. Add IP Address: `0.0.0.0/0` (Allow from anywhere)
3. Wait 1-2 minutes for the change to activate

## Deploy

After setting environment variables and IP whitelist, trigger a new deployment in Vercel.

## Default Admin Account

After first deployment, the following admin account will be created automatically:
- Email: `akira@hkjewel.co`
- Password: `Admin@123`

**Important:** Change this password after first login!
