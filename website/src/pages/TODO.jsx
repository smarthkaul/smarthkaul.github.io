import React from "react";
import { useEffect, useState } from "react";
import ToDoElement from "../components/ToDoElement";
import Navbar from "../components/Navbar";

const TODO = () => {
  const [toDoInput, settoDoInput] = useState("");
  const [todo, setToDo] = useState(
    JSON.parse(localStorage.getItem("toDoList")) || []
  );

  useEffect(() => {
    localStorage.setItem("toDoList", JSON.stringify(todo));
  }, [todo]);

  const addItem = (item) => {
    if (toDoInput.trim().length === 0) {
      return;
    }
    setToDo((prev) => {
      return [...prev, item];
    });
  };

  const removeItem = (element) => {
    const updatedtoDo = todo.filter((word) => word != element);
    setToDo(updatedtoDo);
  };

  return (
    <>
      <div>
        <input
          type="text"
          placeholder="add task"
          value={toDoInput}
          onChange={(e) => settoDoInput(e.target.value)}
        ></input>
        <button
          onClick={(e) => {
            e.preventDefault();
            addItem(toDoInput);
            settoDoInput("");
          }}
        >
          Add
        </button>
        <ul className="space-y-2">
          {todo.map((element, index) => {
            return (
              <ToDoElement
                removeItem={(_) => {
                  removeItem(element);
                }}
                element={element}
              ></ToDoElement>
            );
          })}
        </ul>
      </div>
    </>
  );
};

export default TODO;
