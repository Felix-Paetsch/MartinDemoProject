import React, { useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";

export type Box = {
    id: number;
    color: string;
};

let uiCallbacks = {
    onColorClick: (id: number, color: string) => { },
    onCloseClick: (id: number) => { },
    onAddClick: () => { },
};

let _getBoxes: () => Box[] = () => [];
let _setBoxes: React.Dispatch<React.SetStateAction<Box[]>> = () => { };

/**
 * Actions that must wait until after React commits
 */
type PendingAction =
    | { type: "close"; id: number }
    | { type: "add" }
    | null;

export function ColorDisplayUI() {
    const [boxes, setBoxes] = useState<Box[]>(() =>
        Array.from({ length: 3 }, (_, i) => ({
            id: i,
            color: randomHue(),
        }))
    );

    // Expose committed state to the external API
    _getBoxes = () => boxes;
    _setBoxes = setBoxes;

    // Tracks which post-commit callback should fire
    const pendingActionRef = useRef<PendingAction>(null);

    const handleRemove = (id: number) => {
        pendingActionRef.current = { type: "close", id };
        setBoxes((prev) => prev.filter((b) => b.id !== id));
    };

    const handleAdd = () => {
        pendingActionRef.current = { type: "add" };
        setBoxes((prev) => [
            ...prev,
            { id: Date.now(), color: randomHue() },
        ]);
    };

    const handleClickColor = (id: number, color: string) => {
        // ✅ Pure event → fire immediately
        uiCallbacks.onColorClick(id, color);
    };

    /**
     * Fire state-dependent callbacks only after commit
     */
    useEffect(() => {
        const action = pendingActionRef.current;
        if (!action) return;

        pendingActionRef.current = null;

        switch (action.type) {
            case "close":
                uiCallbacks.onCloseClick(action.id);
                break;
            case "add":
                uiCallbacks.onAddClick();
                break;
        }
    }, [boxes]);

    return (
        <div className={styles.container}>
            <div className={styles.list}>
                {boxes.map((b) => (
                    <div key={b.id} className={styles.box}>
                        <div
                            className={styles.colorSide}
                            style={{ backgroundColor: b.color }}
                            onClick={() =>
                                handleClickColor(b.id, b.color)
                            }
                        />
                        <div
                            className={styles.closeSide}
                            onClick={() => handleRemove(b.id)}
                        >
                            x
                        </div>
                    </div>
                ))}
                <div className={styles.addBox} onClick={handleAdd}>
                    +
                </div>
            </div>
        </div>
    );
}

export const ColorDisplayAPI = {
    onColorClick: (cb: (id: number, color: string) => void) =>
        (uiCallbacks.onColorClick = cb),
    onCloseClick: (cb: (id: number) => void) =>
        (uiCallbacks.onCloseClick = cb),
    onAddClick: (cb: () => void) =>
        (uiCallbacks.onAddClick = cb),

    getBoxes: () => _getBoxes(),

    setBoxColor: (id: number, color: string) =>
        _setBoxes((prev) =>
            prev.map((b) => (b.id === id ? { ...b, color } : b))
        ),

    deleteBox: (id: number) =>
        _setBoxes((prev) => prev.filter((b) => b.id !== id)),

    createBox: (color?: string) =>
        _setBoxes((prev) => [
            ...prev,
            { id: Date.now(), color: color ?? randomHue() },
        ]),

    /**
     * Syncs the boxes with a new array using minimal updates.
     */
    syncBoxes: (newBoxes: Box[]) => {
        _setBoxes((prev) => {
            const updated: Box[] = [];
            const existingMap = new Map<number, Box>();
            prev.forEach((b) => existingMap.set(b.id, b));

            for (const nb of newBoxes) {
                const existing = existingMap.get(nb.id);
                if (!existing || existing.color !== nb.color) {
                    updated.push(nb);
                } else {
                    updated.push(existing);
                }
                existingMap.delete(nb.id);
            }

            return updated;
        });
    },
};

function randomHue() {
    return `hsl(${Math.floor(Math.random() * 360)}, 100%, 50%)`;
}
