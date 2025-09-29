# MERN Blogging Platform

A full-stack blogging platform built with **MongoDB, Express.js, React.js, and Node.js (MERN)**. Users can create, read, update, and delete blog posts, and interact with other users’ content.

## Features

- **User Authentication**: Signup and login with secure password handling.
- **Create & Manage Posts**: Users can write, edit, and delete their own blog posts.
- **View Posts**: Browse and read posts from all users.
- **Responsive Design**: Works seamlessly on desktop and mobile devices.
- **RESTful API**: Backend API built with Express.js and MongoDB.

## Tech Stack

- **Frontend**: React.js, Tailwind CSS / Bootstrap
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/ankush6398/MERN-Blogging-Platform.git


## Install backend dependencies:
cd backend
npm install

##Install frontend dependencies:
cd ../frontend
npm install


## Create a .env file in the backend folder with your MongoDB URI and JWT secret:
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret


##Usage

Access the platform at http://localhost:3000.

Sign up or log in to create and manage your blog posts.

Contributing

Fork the repository.

Create a new branch (git checkout -b feature/YourFeature).

Make changes and commit (git commit -m 'Add some feature').

Push to the branch (git push origin feature/YourFeature).

Open a pull request.

License

This project is licensed under the MIT License.
