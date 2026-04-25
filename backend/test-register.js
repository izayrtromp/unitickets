async function run() {
  try {
    const res = await fetch('http://localhost:3000/auth/register-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: "Test Staff",
        studentId: "staff01",
        email: "staff@ua.aw",
        password: "password123",
        confirmPassword: "password123"
      })
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Data:", data);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

run();
