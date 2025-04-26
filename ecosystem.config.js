module.exports = {
  apps: [
    {
      name: "gdm-backend",
      cwd: "./backend", // ไปที่โฟลเดอร์ backend ก่อน
      script: "npm",
      args: "start",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        PORT: 4700, // หรือ port ที่ backend ใช้
      },
    },
    {
      name: "gdm-frontend",
      cwd: "./frontend", // ไปที่โฟลเดอร์ frontend ก่อน
      script: "npm",
      args: "start",
      interpreter: "none",
      env: {
        NODE_ENV: "development",
        PORT: 3000, // หรือ port ที่ frontend ใช้
      },
    },
  ],
};
