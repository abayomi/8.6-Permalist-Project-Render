import axios from "axios";
import express from "express";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import morgan from "morgan";

console.log("Info log: start variables defined, in apigateway.");
const app = express();
const port = 3000;
const API_URL = "http://localhost:4000";
const _dirname = dirname(fileURLToPath(import.meta.url));
console.log("Info log: end variables defined, in apigateway.");

console.log("Info log: middleware start, in apigateway.");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan("combined"));
console.log("Info log: middleware end, in apigateway.");

console.log(
  "Info log: start of endpoint handling with routing methods, in apigateway."
);

async function createToDoList(req, res, error) {
  try {
    const response = await axios.get(`${API_URL}/items`);
    const objToReturn = {
      listTitle: response.data.listTitle,
      listItems: response.data.listItems,
    };
    if (error != undefined) objToReturn.error = error;
    res.render("index.ejs", objToReturn);
  } catch (error) {
    console.log(`Error log: failed happened at: axios(${API_URL}/items)`);
    //res.status(500).json({ message: "Error fetching items, in apigateway" });
    sendErrorFile(res);
  }
}

function sendErrorFile(res) {
  res.render("error.ejs");
}
app.get("/", async (req, res) => {
  createToDoList(req, res, undefined);
});

app.post("/add", async (req, res) => {
  const item = req.body.newItem;
  try {
    const response = await axios.post(`${API_URL}/addItem`, req.body);
    createToDoList(req, res, response.data.error);
  } catch (error) {
    console.log(`Error log: failed happened at: axios(${API_URL}/add)`);
    sendErrorFile(res);
  }
});

app.post("/edit", async (req, res) => {
  try {
    const response = await axios.post(`${API_URL}/editItem`, req.body);
    createToDoList(req, res, response.data.error);
  } catch (error) {
    console.log(`Error log: failed happened at: axios(${API_URL}/edit)`);
    res.redirect("/");
  }
});

app.post("/delete", async (req, res) => {
  try {
    const response = await axios.post(`${API_URL}/deleteItem`, req.body);
    createToDoList(req, res, response.data.error);
  } catch (error) {
    console.log(`Error log: failed happened at: axios(${API_URL}/edit)`);
    sendErrorFile(res);
  }
});

console.log(
  "Info log: end of endpoint handling  with routing methods, in apigateway."
);

console.log("Info log: app.listen start, in apigateway");
app.listen(port, () => {
  console.log(`API Gateway listening on port ${port}, in apigateway`);
});
console.log("Info log: app.listen end, in apigateway");
