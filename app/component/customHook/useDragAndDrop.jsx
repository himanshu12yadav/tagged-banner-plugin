/**
 * @author Sprinix Team
 * @copyright Copyright (c) 2023 Sprinix Technolabs (https://www.sprinix.com).
 */


import { useCallback, useState } from "react";
import { useDrop } from "react-dnd";
import { ItemTypes } from "../ItemTypes";
import {v4 as uuidv4} from "uuid";

export const useDragAndDrop = () => {
  const [tags, setTag] = useState([]);
  const [pointers, setPointer] = useState([]);
  const [width, setWidth] = useState(null);
  const [height, setHeight] = useState(null);

  const handlePosition = useCallback(({ id, x, y }) => {
    setPointer((prevPointer) =>
      prevPointer.map((t) => (t.id === id ? { ...t, x, y } : t)),
    );
  }, []);

  const handleDragStart = useCallback((event) => {
    console.log("start", event);
  }, []);

  const handleDrop = useCallback(
    (item, monitor) => {
      const dropTarget = document.getElementById("dropTarget");

      const height = dropTarget.clientHeight;
      const width = dropTarget.clientWidth;

      const dropTargetRect = dropTarget.getBoundingClientRect();
      const delta = monitor.getSourceClientOffset();
      const newX = delta.x - dropTargetRect.left;
      const newY = delta.y - dropTargetRect.top;

      handlePosition({ ...item, x: newX, y: newY });
      setHeight(height);
      setWidth(width);
      console.log("Drop", item, width, " ", height);
    },
    [handlePosition],
  );

  const handleAdd = useCallback(() => {
    let id = uuidv4();
    let newTag = {
      id: id,
      sku: null,
      data: null,
    };

    let newPointer = {
      id: id,
      x: 0,
      y: 0,
    };

    setTag((prevTag) => [...prevTag, newTag]);
    setPointer((prevPointer) => [...prevPointer, newPointer]);
  }, []);

  const handleUpdateTag = useCallback((id, updatedData) => {
    setTag((prevTags) =>
      prevTags.map((tag) => (tag.id === id ? { ...tag, ...updatedData } : tag)),
    );
  }, []);

  const handleDelete = useCallback((id) => {
    setTag((prevTag) => prevTag.filter((tag) => tag.id !== id));
    setPointer((prevPointer) => prevPointer.filter((p) => p.id !== id));
  }, []);

  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.TAG,
    drop: (item, monitor) => handleDrop(item, monitor),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  return {
    tags,
    setTag,
    pointers,
    setPointer,
    handleAdd,
    handleDelete,
    handleDragStart,
    handleDrop,
    handleUpdateTag,
    drop,
    isOver,
    width,
    height,
  };
};
