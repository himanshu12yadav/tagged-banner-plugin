/**
 * @author Sprinix Team
 * @copyright Copyright (c) 2023 Sprinix Technolabs (https://www.sprinix.com).
 */

import { useDrag } from "react-dnd";
import { ItemTypes } from "../ItemTypes";
import styles from "./DropAndDrag.module.css";
import { Tooltip as ReactTooltip } from "react-tooltip";
import { useEffect, useState } from "react";

export const DragAndDrop = ({ id, x, y, data = "", handleDragStart }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.TAG,
    item: { id, x, y },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    end: (item, monitor) => {
      if (monitor.didDrop()) {
        const dropResult = monitor.getDropResult();
        console.log("Dropped: ", dropResult);
      } else {
        console.log("Dropped cancelled.");
      }
    },
  });


  useEffect(() => {
    if (isDragging) {
      handleDragStart();
    }
  }, [isDragging, handleDragStart]);

  return (
    <>
      <div
        style={{ left: `${x}px`, top: `${y}px` }}
        className={styles.circle}
        ref={drag}
        data-tooltip-id={id}
        data-tooltip-html={data}
      >
        <div className={styles.hole}>
          <div className={{ padding: "10px 0" }}></div>
        </div>
      </div>
      <ReactTooltip id={id} place="top" effect="solid" clickable>
        {data ? data : "Empty tooltip"}
      </ReactTooltip>
    </>
  );
};
