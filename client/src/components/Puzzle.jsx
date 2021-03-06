import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import Chessboard from 'chessboardjsx';
import Chess from 'chess.js';
import axios from 'axios';
import { baseURL, config, chessConfig } from '../services';
import BackButton from './BackButton';
import LoadingScreen from './LoadingScreen';
import Modal from './Modal';
import MoveHistory from './MoveHistory';
import "../css/Puzzle.css";

export default function Puzzle() {
  const [chess] = useState(
    new Chess(chessConfig)
  );

  const [fen, setFen] = useState(chess.fen());
  const [numMoves, setNumMoves] = useState(0);
  const [moves, setMoves] = useState('');
  const params = useParams();

  const [isLoading, setIsLoading] = useState(false);
  const [boardSize, setBoardSize] = useState(700);

  const [showModal, setShowModal] = useState(false);
  const [movesTaken, setMovesTaken] = useState([]);

  const getNextMove = () => {
    if (moves.length >= 4) {
      const currMoves = [{
        from: moves.slice(0, 2),
        to: moves.slice(2, 4),
        piece: chess.get(moves.slice(2,4)),
        promotion: 'q',
      }, {
        from: moves.slice(4, 6),
        to: moves.slice(6,8),
        piece: chess.get(moves.slice(4,6)),
        promotion: 'q',
      }];
      console.log(currMoves);
      return currMoves;
    } else {
      const currMoves = [{
        from: moves.slice(0, 2),
        to: moves.slice(2),
        piece: chess.get(moves.slice(2)),
        promotion: 'q'
      }, {}];
      console.log(currMoves);
      return currMoves;
    }
  } 

  useEffect(() => {
    const getInitialBoard = async () => {
      setIsLoading(true);
      const res = await axios.get(`${baseURL}/${params.id}`, config);
      chess.load(res.data.fields.initialBoard);
      setNumMoves(res.data.fields.numMoves);
      setMoves(res.data.fields.moves);
      setFen(chess.fen());
      setBoardSize(window.innerWidth/2);
      setIsLoading(false);
    }
    getInitialBoard();
  }, [chess, params.id]);

  const handleMove = (move) => {
    if (chess.move(move)) {
      //check if move equals airtable move
      const [correctMove, enemyMove] = getNextMove();  
      if (correctMove.to !== move.to || correctMove.from !== move.from) {
        chess.undo();
      } else if (correctMove.to === move.to && correctMove.from === move.from) {
        if (numMoves === 1) {
          setNumMoves(numMoves - 1);
          setShowModal(true);
          setMovesTaken(prevArray => [...prevArray, correctMove]);
        } else {
          setMovesTaken(prevArray => [...prevArray, correctMove]);
          setTimeout(() => {
            chess.move(enemyMove);
            setNumMoves(numMoves - 1);
            setFen(chess.fen());
            setMoves(moves.slice(8));
            setMovesTaken(prevArray => [...prevArray, enemyMove]);
          }, 500);
        }
      }
      setFen(chess.fen());
    }
  }
  return (
    <div className="Puzzle">
      <LoadingScreen isLoading={isLoading}>
        <Modal showModal={showModal} id={params.id}/>
        <BackButton/>
        <div className="ChessBoardContainer">
          <div className="Moves">
            <div className="MovesLeft">Moves Left: {numMoves}</div>
            <MoveHistory movesTaken={movesTaken}/>
          </div>
          <Chessboard
            boardStyle={{
              boxShadow: '0px 5px 10px 2px #4e4e54',
            }}
            position={fen}
            onDrop={(move) => handleMove({
              from: move.sourceSquare,
              to: move.targetSquare,
              piece: move.piece,
              promotion: 'q',
            })}
            width={boardSize}
          />
        </div>
      </LoadingScreen>
    </div>
  )
}