require("dotenv").config();
const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));
app.use(express.static("../"));

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
app.post("/organizar", async (req, res) => {
  const mensajeUsuario = req.body.mensaje || "";
  const archivo = req.body.archivo;

  if (mensajeUsuario.length > 500) {
    return res.status(400).json({ error: true, mensaje: "El mensaje es demasiado largo. Intenta resumirlo un poco." });
  }

  const contenido = [];

  if (archivo) {
    if (archivo.mediaType === "application/pdf") {
      contenido.push({
        type: "document",
        source: { type: "base64", media_type: archivo.mediaType, data: archivo.data }
      });
    } else {
      contenido.push({
        type: "image",
        source: { type: "base64", media_type: archivo.mediaType, data: archivo.data }
      });
    }
  }

  contenido.push({
    type: "text",
    text: `Organiza esta semana de forma clara y práctica. Si hay un archivo adjunto (imagen o PDF), ten en cuenta su contenido (por ejemplo, un horario) para la organización: ${mensajeUsuario}`
  });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        messages: [
          { role: "user", content: contenido }
        ]
      })
    });

    const data = await response.json();

    if (data.type === "error") {
      console.error("Error de la API:", data.error);
      return res.status(502).json({ error: true, mensaje: "ChronAI no ha podido procesar tu mensaje ahora mismo. Inténtalo de nuevo en unos minutos." });
    }

    const respuestaIA = data.content[0].text;
    res.json({ respuesta: respuestaIA });

  } catch (error) {
    console.error("Error de red o del servidor:", error);
    res.status(500).json({ error: true, mensaje: "ChronAI no ha podido procesar tu mensaje ahora mismo. Inténtalo de nuevo en unos minutos." });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});