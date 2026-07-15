/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, logout } from "../service/auth.service";
import { getUserScores, getUserScoreByUserId, insertGame, upsertUserScores } from "../service/games.service";

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
    const [userId, setUserId] = useState("");
    const [userScores, setUserScores] = useState([]);

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    };

    const onGetUserScores = async () => {
        try {
            const { data: userScoresData, error: userScoresError } = await getUserScores();
            if (userScoresError) return;
            setUserScores(userScoresData);
        } catch (error) {
            alert(error.message);
        }
    };

    useEffect(() => {
        const onGetCurrentUser = async () => {
            try {
                const { data: currentUserData, error: userError } = await getCurrentUser();
                if (userError) return;
                setUsername(currentUserData?.user.user_metadata.username);
                setUserId(currentUserData?.user.id);
            } catch (error) {
                alert(error.message);
            }
        };
        onGetCurrentUser();
        onGetUserScores();
    }, []);

    // bot Tic-tac-toe
    const [board, setBoard] = useState(Array(9).fill(null));
    const [winner, setWinner] = useState(null);
    const [playerScore, setPlayerScore] = useState(0);
    const [botScore, setBotScore] = useState(0);
    // เช็คชนะต่อเนื่อ 3 ครั้ง
    const [winStreak, setWinStreak] = useState(0);
    // ตัวเก็บคะแนน
    const [winCount, setWinCount] = useState(0);
    const [loseCount, setLoseCount] = useState(0);
    const [drawCount, setDrawCount] = useState(0);

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

    // เงื่อนไขการนับคะแนน & เมื่อเส่นจบเกมยิง api เก็บข้อมูล
    useEffect(() => {
        if (!winner) return;

        // คำนวณค่าใหม่ก่อน แล้วใช้ชุดเดียวกันทั้งกับ state และ payload
        let scoreChange = 0;
        let newStreak = winStreak;
        let newWinCount = winCount;
        let newLoseCount = loseCount;
        let newDrawCount = drawCount;

        if (winner === "X") {
            newStreak = winStreak + 1;
            scoreChange = newStreak === 3 ? 2 : 1; // 1 คะแนนปกติ + 1 โบนัสเมื่อชนะครบ 3 ครั้งติด
            if (newStreak === 3) newStreak = 0; // ครบ 3 แล้ว นับใหม่
            newWinCount = winCount + 1;
        }

        if (winner === "O") {
            scoreChange = -1;
            newStreak = 0; // แพ้ = สตรีคขาด
            newLoseCount = loseCount + 1;
            setBotScore(botScore + 1);
        }

        if (winner === "Draw") {
            newDrawCount = drawCount + 1;
        }

        const newScore = playerScore + scoreChange;

        setPlayerScore(newScore);
        setWinStreak(newStreak);
        setWinCount(newWinCount);
        setLoseCount(newLoseCount);
        setDrawCount(newDrawCount);

        const onInsertGame = async () => {
            try {
                const payload = {
                    user_id: userId,
                    result: winner === "X" ? "WIN" : winner === "O" ? "LOSE" : "DRAW",
                    score_change: scoreChange,
                };

                const { error: gameError } = await insertGame(payload);
                if (gameError) return alert(gameError?.message);
            } catch (error) {
                alert(error.message);
            }
        };
        onInsertGame();

        const onUpsertUserScores = async () => {
            try {
                const { data: oldScoreData, error: oldScoreError } = await getUserScoreByUserId(userId);
                if (oldScoreError) return alert(oldScoreError?.message);

                const payload = {
                    user_id: userId,
                    win_count: newWinCount,
                    lose_count: newLoseCount,
                    draw_count: newDrawCount,
                    win_streak: newStreak,
                };

                // เก็บคะแนนสูงสุดไว้: ส่ง field score เฉพาะแถวใหม่ หรือคะแนนใหม่มากกว่าคะแนนเก่า
                if (!oldScoreData || newScore > oldScoreData.score) {
                    payload.score = newScore;
                }

                const { error: userScoresError } = await upsertUserScores(payload);
                if (userScoresError) return alert(userScoresError?.message);
            } catch (error) {
                alert(error.message);
            }
        };
        // รอ upsert เสร็จก่อนแล้วค่อยดึง userScores ออกมา
        onUpsertUserScores().then(() => onGetUserScores());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [winner]);

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
                    <div>คะแนนผู้เล่น: {playerScore}</div>
                    <div>คะแนนบอท: {botScore}</div>
                </div>
                <div className="border flex justify-center mb-4">
                    <h2>
                        {winner
                            ? winner === "Draw"
                                ? "เสมอ"
                                : `${winner === "X" ? "ผู้เล่น" : "บอท"} ชนะ`
                            : "คุณคือ X"}
                    </h2>
                </div>
                <div className="border flex justify-center mb-4">
                    <div>ชนะติดต่อกัน: {winStreak}/3</div>
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
                                {userScores?.map((item, index) => (
                                    <div key={item.user_id} className="border p-2">
                                        <div
                                            className={`flex justify-between mb-2 ${userId === item.user_id ? "bg-yellow-200" : ""}`}
                                        >
                                            <div>
                                                {index + 1}. {item?.profiles?.username || ""}
                                            </div>
                                            <div>{item?.score || 0} คะแนนสูงสุด</div>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <div className="border p-2 text-center">
                                                <div>ชนะ</div>
                                                <div>{item.win_count}</div>
                                            </div>
                                            <div className="border p-2 text-center">
                                                <div>แพ้</div>
                                                <div>{item.lose_count}</div>
                                            </div>
                                            <div className="border p-2 text-center">
                                                <div>เสมอ</div>
                                                <div>{item.draw_count}</div>
                                            </div>
                                            <div className="border p-2 text-center">
                                                <div>ชนะต่อเนื่อง</div>
                                                <div>{item.win_streak}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </dialog>
                </div>
            </div>
        </div>
    );
}

export default Page;
