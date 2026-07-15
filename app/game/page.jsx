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
        setTimeout(() => {
            resetGame();
        }, 1500);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [winner]);

    function resetGame() {
        setBoard(Array(9).fill(null));
        setWinner(null);
    }
    // bot Tic-tac-toe

    return (
        <div className="w-full h-full lg:h-dvh flex flex-col-reverse lg:flex-row p-4">
            <div className="w-full h-full hidden lg:block"></div>
            <div className="w-full h-fit grid items-center lg:justify-center lg:p-8 gap-4">
                <div className="border flex justify-between gap-10 p-2">
                    <div>คะแนนผู้เล่น: {playerScore}</div>
                    <div>คะแนนบอท: {botScore}</div>
                </div>
                <div className="border flex justify-center p-2">
                    <h2>
                        {winner
                            ? winner === "Draw"
                                ? "เสมอ"
                                : `${winner === "X" ? "ผู้เล่น" : "บอท"} ชนะ`
                            : "คุณคือ X"}
                    </h2>
                </div>
                <div className="border flex justify-center p-2">
                    <div>ชนะติดต่อกัน: {winStreak}/3</div>
                </div>
                <div className="h-80 w-full lg:w-80 border flex items-center justify-center">
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
                <div className="flex justify-center">
                    <button onClick={resetGame}>เล่นใหม่</button>
                </div>
            </div>
            <div className="w-full h-full">
                <div className="flex flex-col items-end pb-4 lg:p-8">
                    <div className="flex flex-wrap items-center justify-end py-4 gap-4 lg:py-0 lg:gap-8 lg:mb-8">
                        <h2 className="w-full lg:w-fit text-end">
                            สวัสดีผู้เล่น <span className="underline">{username}</span>
                        </h2>
                        <button type="button" onClick={() => setIsShowBoard(!isShowBoard)} className="bg-yellow-500!">
                            ตรวจสอบคะแนน
                        </button>
                        <button type="button" onClick={handleLogout} className="bg-red-500! text-white flex">
                            ออก<span className="hidden lg:block">จากระบบ</span>
                        </button>
                    </div>
                    {isShowBoard && (
                        <div className="w-full lg:w-100 p-4 border">
                            <h2 className="mb-2">คะแนนของผู้เล่นทั้งหมด</h2>
                            <div className="grid gap-2">
                                {userScores?.map((item, index) => (
                                    <details key={item.user_id} className="border p-2 bg-white">
                                        <summary
                                            className={`flex justify-between ${userId === item.user_id ? "bg-green-200" : ""}`}
                                        >
                                            <div>
                                                {index + 1}. {item?.profiles?.username || ""}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div>{item?.score || 0} คะแนนสูงสุด</div>
                                                <div className="flex justify-center items-center h-4 w-4 bg-blue-500 rounded-full text-white cursor-pointer">
                                                    +
                                                </div>
                                            </div>
                                        </summary>
                                        <div className="flex justify-between items-center text-sm pt-2 gap-2">
                                            <div className="border p-2 w-full text-center flex-1">
                                                <div>ชนะ</div>
                                                <div>{item.win_count}</div>
                                            </div>
                                            <div className="border p-2 w-full text-center flex-1">
                                                <div>แพ้</div>
                                                <div>{item.lose_count}</div>
                                            </div>
                                            <div className="border p-2 w-full text-center flex-1">
                                                <div>เสมอ</div>
                                                <div>{item.draw_count}</div>
                                            </div>
                                            <div className="border p-2 w-full text-center flex-2">
                                                <div>ชนะต่อเนื่อง</div>
                                                <div>{item.win_streak}</div>
                                            </div>
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Page;
