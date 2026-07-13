/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, logout } from "../service/auth.service";

const WIN_PATTERNS = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
];

function Page() {
    const router = useRouter();
    const [isShowBoard, setIsShowBoard] = useState(false);
    const [username, setUsername] = useState("");

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    };

    useEffect(() => {
        const onGetCurrentUser = async () => {
            const { data: currentUserData, error: userError } = await getCurrentUser();
            if (userError) return;
            setUsername(currentUserData?.user.user_metadata.username);
        };
        onGetCurrentUser();
    }, []);

    // bot Tic-tac-toe
    const [board, setBoard] = useState(Array(9).fill(null));
    const [winner, setWinner] = useState(null);

    function checkWinner(currentBoard) {
        for (const pattern of WIN_PATTERNS) {
            const [a, b, c] = pattern;
            if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
                return currentBoard[a];
            }
        }
        if (!currentBoard.includes(null)) return "Draw";
        return null;
    }

    function findWinningMove(currentBoard, player) {
        for (const pattern of WIN_PATTERNS) {
            const values = pattern.map((i) => currentBoard[i]);
            const countPlayer = values.filter((v) => v === player).length;
            const countEmpty = values.filter((v) => v === null).length;
            if (countPlayer === 2 && countEmpty === 1) {
                return pattern[values.indexOf(null)];
            }
        }
        return null;
    }

    function botMove(currentBoard) {
        // ชนะ
        let move = findWinningMove(currentBoard, "O");
        if (move !== null) return move;
        // บล็อก
        move = findWinningMove(currentBoard, "X");
        if (move !== null) return move;
        // ตรงกลาง
        if (currentBoard[4] === null) return 4;
        // มุม
        const corners = [0, 2, 6, 8];
        for (const c of corners) {
            if (currentBoard[c] === null) return c;
        }
        // ช่องแรกที่ว่าง
        return currentBoard.findIndex((cell) => cell === null);
    }

    function handleClick(index) {
        if (board[index] || winner) return;
        const newBoard = [...board];
        newBoard[index] = "X";
        setBoard(newBoard);
    }
    useEffect(() => {
        const result = checkWinner(board);
        if (result) {
            setWinner(result);
            return;
        }
        const xCount = board.filter((v) => v === "X").length;
        const oCount = board.filter((v) => v === "O").length;
        if (xCount > oCount) {
            const timer = setTimeout(() => {
                const move = botMove(board);
                if (move === -1) return;
                const newBoard = [...board];
                newBoard[move] = "O";
                setBoard(newBoard);
            }, 400);
            return () => clearTimeout(timer);
        }
    }, [board]);

    useEffect(() => {
        const result = checkWinner(board);
        if (result) {
            setWinner(result);
        }
    }, [board]);

    function resetGame() {
        setBoard(Array(9).fill(null));
        setWinner(null);
    }
    // bot Tic-tac-toe

    return (
        <div className="w-full h-dvh flex items-center justify-center relative">
            <div>
                <div className="absolute top-8 right-8 flex items-center gap-8">
                    <h2>สวัสดีผู้เล่น {username}</h2>
                    <button type="button" onClick={() => setIsShowBoard(!isShowBoard)}>
                        ตรวจสอบคะแนน
                    </button>
                    <button type="button" onClick={handleLogout}>
                        ออกจากระบบ
                    </button>
                </div>
                <div className="border flex justify-between mb-4">
                    <div>ผู้เล่น: 0</div>
                    <div>บอท: 0</div>
                </div>
                <div className="border flex justify-center mb-4">
                    <h2>{winner ? (winner === "Draw" ? "เสมอ" : `${winner} ชนะ`) : "คุณคือ X"}</h2>
                </div>
                <div className="h-80 w-80 border flex items-center justify-center">
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 80px)",
                            gap: 5,
                        }}
                    >
                        {board.map((cell, index) => (
                            <button
                                key={index}
                                onClick={() => handleClick(index)}
                                style={{
                                    width: 80,
                                    height: 80,
                                    fontSize: 32,
                                    cursor: "pointer",
                                    border: "1px solid",
                                }}
                            >
                                {cell}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex justify-center mt-4">
                    <button onClick={resetGame}>เล่นใหม่</button>
                </div>
                <div className="absolute top-30 right-90 flex gap-8">
                    <dialog open={isShowBoard}>
                        <div className="border w-80 p-4">
                            <h2 className="mb-2">คะแนนของผู้เล่นทั้งหมด</h2>
                            <div className="grid gap-2">
                                <div className="border p-2 flex justify-between">
                                    <div>1. ชื่อผู้เล่น</div>
                                    <div>10 คะแนน</div>
                                </div>
                                <div className="border p-2 flex justify-between">
                                    <div>1. ชื่อผู้เล่น</div>
                                    <div>10 คะแนน</div>
                                </div>
                                <div className="border p-2 flex justify-between">
                                    <div>1. ชื่อผู้เล่น</div>
                                    <div>10 คะแนน</div>
                                </div>
                            </div>
                        </div>
                    </dialog>
                </div>
            </div>
        </div>
    );
}

export default Page;
