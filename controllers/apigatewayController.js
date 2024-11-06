import axios from "axios";
import express from "express";
import Debug from "debug";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import {
  tryCatchAsyncController,
  checkIsNotUndefined,
} from "../utils/tryCatch-checkUndefined.js";

const debugInfo = Debug("apigateway-info-logs");
const debugError = Debug("apigateway-error-logs");
const API_URL = "http://localhost:4000";
const _dirname = dirname(fileURLToPath(import.meta.url));

/*calls API to get list of to do list items
@params error: if error is undefined that means error contains a string that says that an error occurred during adding, updating or deleting an item. It means we can still use this createToDoList method to retrieve all the values in the database and create a list for the user. we will pass along this error to the ui as well, so the user knows that the last opreation failed.
*/
async function createToDoList(req, res, error) {
  debugInfo("Info log: createToDoList start, in apigateway.");
  const response = await axios.get(`${API_URL}/api/v1/items`);
  debugInfo(
    "Info log: axios request completed, createToDoList, in apigateway."
  );
  if (response.data.error == undefined) {
    debugInfo(
      "Info log: Check if there was an error when retrieving all items via axios and if not, show the user the regular page, but if there was an error, then show the user the error page, createToDoList, in apigateway."
    );
    const objToReturn = {
      listTitle: response.data.listTitle,
      listItems: response.data.listItems,
    };
    debugInfo("Info log: objToReturn created, createToDoList, in apigateway.");
    if (error != undefined) {
      debugInfo(
        "Info log: There was an error while doing a create, update or delete operation, prior to the axios get in this function. This error is passed along to the ui, createToDoList, in apigateway."
      );
      objToReturn.error = error;
      debugInfo(
        "Info log: error added to objToReturn, createToDoList, in apigateway."
      );
    }
    res.render(path.join(_dirname, "../views/index.ejs"), objToReturn);
  } else {
    debugInfo(
      "Info log: There was an error in retrieving all that data via axios, createToDoList, in apigateway."
    );
    res.render(_dirname + "/views/error.ejs", { error: response.data.error });
  }
  debugInfo("Info log: createToDoList end, in apigateway.");
}

async function apigatewayGetAllController(req, res, next) {
  debugInfo("Info log: app.get / func start, in apigateway.");
  await createToDoList(req, res, undefined);
  debugInfo("Info log: app.get / func end, in apigateway.");
}

/*Adding an item on a to do list. First it is determined whether any of the necessary form data is undefined and if it is all defined then the api call to make the update is made in the try block.*/
async function apigatewayAddController(req, res, next) {
  debugInfo("Info log: app.post /add func start, in apigateway.");
  req.messageInEventOfErrorDuringExecutionOfAxios = `Error log: failed happened at: axios(${API_URL}/api/v1/items/add)`;
  let messageIfDataIsUndefined = `All the data needed to add the item was not entered, so the item could not be added.`;
  const isNotUndefined = checkIsNotUndefined(
    [req.body.newItem],
    messageIfDataIsUndefined,
    next
  );
  if (isNotUndefined) {
    const response = await axios.post(`${API_URL}/api/v1/items/add`, req.body);
    await createToDoList(req, res, response.data.error);
  }
  debugInfo("Info log: app.post /add func end, in apigateway.");
}
/*Updating an item on a to do list. First it is determined whether any of the necessary form data is undefined and if it is all defined then the api call to make the update is made in the try block.*/
async function apigatewayEditController(req, res, next) {
  debugInfo("Info log: app.post /edit func start, in apigateway.");
  req.messageInEventOfErrorDuringExecution = `Error log: failed happened at: axios(${API_URL}/api/v1/items/edit)`;
  let messageIfDataIsUndefined = `All the data needed to edit the item was not entered, so the item could not be edited.`;
  const isNotUndefined = checkIsNotUndefined(
    [req.body.updatedItemId, req.body.updatedItemTitle],
    messageIfDataIsUndefined,
    next
  );
  if (isNotUndefined) {
    const response = await axios.patch(
      `${API_URL}/api/v1/items/edit`,
      req.body
    );
    await createToDoList(req, res, response.data.error);
  }
  debugInfo("Info log: app.post /edit func end, in apigateway.");
}

/*Deleting an item on a to do list. First it is determined whether any of the necessary form data is undefined and if it is all defined then the api call to make the update is made in the try block.*/
async function apigatewayDeleteController(req, res, next) {
  debugInfo("Info log: app.post /delete func start, in apigateway.");
  req.messageInEventOfErrorDuringExecution = `Error log: failed happened at: axios(${API_URL}/api/v1/items/delete)`;
  let messageIfDataIsUndefined = `All the data needed to delete the item was not entered, so the item could not be deleted.`;
  const isNotUndefined = checkIsNotUndefined(
    [req.body.deleteItemId],
    messageIfDataIsUndefined,
    next
  );
  if (isNotUndefined) {
    const response = await axios.delete(`${API_URL}/api/v1/items/delete`, {
      data: { deleteItemId: req.body.deleteItemId },
    });
    await createToDoList(req, res, response.data.error);
  }
  debugInfo("Info log: app.post /delete func end, in apigateway.");
}

export {
  apigatewayGetAllController,
  apigatewayDeleteController,
  apigatewayEditController,
  apigatewayAddController,
};
