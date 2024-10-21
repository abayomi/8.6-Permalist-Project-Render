import axios from "axios";
import express from "express";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import morgan from "morgan";
import Debug from "debug";
import CustomError from "./utils/CustomError.js";
import globalErrorHandlingMiddlewareController from "./controllers/errorController.js";
import { sendErrorFile } from "./utils/errorFile.js";
import {
  tryCatch,
  checkIsNotUndefined,
} from "./utils/tryCatch-checkUndefined.js";

const debugInfo = Debug("apigateway-info-logs");
const debugError = Debug("apigateway-error-logs");
debugInfo("Info log: start variables defined, in apigateway.");
const app = express();
const port = 3000;
const _dirname = dirname(fileURLToPath(import.meta.url));
const API_URL = "http://localhost:4000";
//const API_URL = `https://eight-6-permalist-project-render-server.onrender.com`;
debugInfo("Info log: end variables defined, in apigateway.");

debugInfo("Info log: middleware start, in apigateway.");
app.use(express.static(_dirname + "/public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan("combined"));
debugInfo("Info log: middleware end, in apigateway.");

/*calls API to get list of to do list items*/
async function createToDoList(req, res, error) {
  debugInfo("Info log: createToDoList start, in apigateway.");

  const response = await axios.get(`${API_URL}/items`);
  const objToReturn = {
    listTitle: response.data.listTitle,
    listItems: response.data.listItems,
  };
  if (error != undefined) objToReturn.error = error;
  res.render(_dirname + "/views/index.ejs", objToReturn);

  debugInfo("Info log: createToDoList end, in apigateway.");
}

/*Base URL endpoint handled.*/
app.get(
  "/",
  tryCatch(async (req, res, next) => {
    debugInfo("Info log: app.get / func start, in apigateway.");
    await createToDoList(req, res, undefined);
    debugInfo("Info log: app.get / func end, in apigateway.");
  })
);

/*Adding an item on a to do list. First it is determined whether any of the necessary form data is undefined and if it is all defined then the api call to make the update is made in the try block.*/
app.post(
  "/addItem",
  tryCatch(async (req, res, next) => {
    debugInfo("Info log: app.post /add func start, in apigateway.");
    req.messageInEventOfErrorDuringExecutionOfAxios = `Error log: failed happened at: axios(${API_URL}/addItem)`;
    let messageIfDataIsUndefined = `All the data needed to add the item was not entered, so the item could not be added.`;
    const isNotUndefined = checkIsNotUndefined(
      [req.body.newItem],
      messageIfDataIsUndefined,
      next
    );
    if (isNotUndefined) {
      const response = await axios.post(`${API_URL}/addItem`, req.body);
      await createToDoList(req, res, response.data.error);
    }
    debugInfo("Info log: app.post /add func end, in apigateway.");
  })
);

/*Updating an item on a to do list. First it is determined whether any of the necessary form data is undefined and if it is all defined then the api call to make the update is made in the try block.*/
app.post(
  "/editItem",
  tryCatch(async (req, res, next) => {
    debugInfo("Info log: app.post /edit func start, in apigateway.");
    req.messageInEventOfErrorDuringExecution = `Error log: failed happened at: axios(${API_URL}/editItem)`;
    let messageIfDataIsUndefined = `All the data needed to edit the item was not entered, so the item could not be edited.`;
    const isNotUndefined = checkIsNotUndefined(
      [req.body.updatedItemId, req.body.updatedItemTitle],
      messageIfDataIsUndefined,
      next
    );
    if (isNotUndefined) {
      const response = await axios.patch(`${API_URL}/editItem`, req.body);
      await createToDoList(req, res, response.data.error);
    }
    debugInfo("Info log: app.post /edit func end, in apigateway.");
  })
);

/*Deleting an item on a to do list. First it is determined whether any of the necessary form data is undefined and if it is all defined then the api call to make the update is made in the try block.*/
app.post(
  "/deleteItem",
  tryCatch(async (req, res, next) => {
    debugInfo("Info log: app.post /delete func start, in apigateway.");
    req.messageInEventOfErrorDuringExecution = `Error log: failed happened at: axios(${API_URL}/deleteItem)`;
    let messageIfDataIsUndefined = `All the data needed to delete the item was not entered, so the item could not be deleted.`;
    const isNotUndefined = checkIsNotUndefined(
      [req.body.deleteItemId],
      messageIfDataIsUndefined,
      next
    );
    if (isNotUndefined) {
      const response = await axios.delete(`${API_URL}/deleteItem`, {
        data: { deleteItemId: req.body.deleteItemId },
      });
      await createToDoList(req, res, response.data.error);
    }
    debugInfo("Info log: app.post /delete func end, in apigateway.");
  })
);

/*Handling all endpoint requests that are invalid.*/
app.all("*", async (req, res, next) => {
  debugInfo("Info log: app.all * func start, in apigateway.");
  // Option1
  //I considered creating an error object and passing it to the global error handling middleware. But for now decided against that. The code is still here as I want to think about it.
  //Simple error message in he brackets below, might need to be altered.
  const err = new Error(
    `Custom error: Can't find ${req.originalUrl} on the api gateway.`
  );
  err.status = "fail";
  err.statusCode = 404;
  //In the line below, passing any parameter to the next function, Express will know an error has happened and Express will bypass all other middleware functions which are present in the middleware stack and will directly call the global error handling middleware below.
  //next(err); //commented out until i decide to use this error to trigger the global error handling middleware. will replace senErrorFIle
  // Option 2
  //Considering having a custom error class. Commented out until I decide.
  const erro = new CustomError(
    `Can't find  ${req.originalUrl} on the api gateway!`,
    404
  );
  next(err); //commented out until i decide to use this custom error to trigger the global error handling middleware. will replace senErrorFIle
  //Option 3
  //sendErrorFile(res);
  debugInfo("Info log: app.all * func end, in apigateway.");
});

/*Global error handling middleware.*/
app.use(globalErrorHandlingMiddlewareController);

/*Listening on port.*/
debugInfo("Info log: app.listen start, in apigateway");
app.listen(port, () => {
  debugInfo(`API Gateway listening on port ${port}, in apigateway`);
});
debugInfo("Info log: app.listen end, in apigateway");

/*This is called if an async function has an unhandled promise rejection. If this was not here, then the rejected promise would eventually be caught by the uncaughtException below.*/
process.on("unhandledRejection", (error) => {
  const err = new CustomError("Something went really wrong", 404);
  //to do: send out email and restart processes automatically https://www.youtube.com/watch?v=vAH4GRWbAQw
  next(err);
});

/*Catches exceptions that were not handled in the code. So this is the last place for the node process to catch the error and gracefully handle it.*/
process.on("uncaughtException", (error) => {
  const err = new CustomError("Something went really wrong", 404);
  //to do: send out email and restart processes automatically https://www.youtube.com/watch?v=vAH4GRWbAQw
  //do some checks to determine status of services and database
  next(err);
});
