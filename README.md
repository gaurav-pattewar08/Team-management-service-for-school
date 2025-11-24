This project is a **NestJS-based backend** for managing a school-level **Mini IPL Tournament**.  
It includes authentication, authorization, team and player management, file uploads, and email notifications.

---

## 🚀 Tech Stack

- **Backend Framework:** NestJS  
- **ORM:** Sequelize (with TypeScript)  
- **Database:** PostgreSQL  
- **Authentication:** JWT-based Auth  
- **File Uploads:** Cloudinary Integration  
- **Email Service:** Outlook SMTP  
- **Validation:** class-validator  

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory and add the following variables:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=xyz
DB_NAME=xyz
JWT_SECRET=xyz

OUTLOOK_EMAIL=xyz
OUTLOOK_PASSWORD=xyz

CLOUDINARY_CLOUD_NAME=xyz
CLOUDINARY_API_KEY=xyz
CLOUDINARY_API_SECRET=xyz

APP_URL=http://localhost:3000


## Installation
git clone <your-repo-url>

# Install dependencies
npm install

# Create a .env file (use the variables above)

# Start the application
npm run start:dev