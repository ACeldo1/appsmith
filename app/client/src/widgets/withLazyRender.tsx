import { useEffect, useRef, useState } from "react";
import React from "react";
import BaseWidget, { WidgetProps } from "./BaseWidget";
import { useSelector } from "react-redux";
import { AppState } from "ce/reducers";

export function withLazyRender(Widget: typeof BaseWidget) {
  return function WrappedComponent(props: WidgetProps) {
    const isDragging = useSelector(
      (state: AppState) => state.ui.widgetDragResize.isDragging,
    );
    const [deferRender, setDeferRender] = useState(!isDragging);
    const wrapperRef = useRef<HTMLDivElement>(null);
    let observer: IntersectionObserver;

    useEffect(() => {
      if (wrapperRef.current && deferRender) {
        observer = new IntersectionObserver(
          (entries: IntersectionObserverEntry[]) => {
            if (!!entries.find((entry) => entry.isIntersecting)) {
              setDeferRender(false);
            } else {
              (window as any).requestIdleCallback(
                () => {
                  setDeferRender(false);
                },
                {
                  timeout: 1500,
                },
              );
            }

            wrapperRef.current && observer.unobserve(wrapperRef.current);
          },
          {
            root: wrapperRef.current?.closest(".lazy-rendering-root"),
            threshold: 0,
          },
        );

        observer.observe(wrapperRef.current);
      }
    }, []);

    return (
      <Widget {...props} deferRender={deferRender} wrapperRef={wrapperRef} />
    );
  };
}
