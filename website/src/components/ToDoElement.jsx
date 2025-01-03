import React from "react";

const ToDoElement = ({ removeItem, element }) => {
  return (
    <li key={element} className="py-5 bg-rose-500 text-yellow-400 rounded-md">
      {element}
      <button onClick={removeItem}>remove</button>
    </li>
  );
};

export default ToDoElement;
