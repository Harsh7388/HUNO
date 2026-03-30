import type { Card as CardType, CardType as CT } from '../types/game';

interface Props {
  card: CardType;
  playable?: boolean;
  onClick?: () => void;
  small?: boolean;
  faceDown?: boolean;
}

function getLabel(card: CardType): string {
  switch (card.type) {
    case 'number':  return String(card.value ?? '');
    case 'skip':    return '⊘';
    case 'reverse': return '↺';
    case 'draw2':   return '+2';
    case 'wild':    return '★';
    case 'wild4':   return '+4';
    case 'wild6':   return '+6';
    case 'swap':    return '⇄';
    default:        return '?';
  }
}

function isSmallLabel(t: CT): boolean {
  return ['skip','reverse','draw2','wild','wild4','wild6','swap'].includes(t);
}

const Card: React.FC<Props> = ({ card, playable, onClick, small, faceDown }) => {
  const sizeStyle = small
    ? { width: 48, height: 72, borderRadius: 10, borderWidth: 2 }
    : {};

  if (faceDown) {
    return (
      <div className="card back" style={sizeStyle}>
        <div className="card-back-design" style={small ? { width:34, height:54, fontSize:'0.75rem' } : {}}>
          HUNO
        </div>
      </div>
    );
  }

  const label = getLabel(card);
  const colorClass = `card-${card.color}`;
  const playableClass = playable === true ? 'playable' : playable === false ? 'not-playable' : '';

  return (
    <div
      className={`card ${colorClass} ${playableClass}`}
      style={sizeStyle}
      onClick={playable !== false ? onClick : undefined}
      title={`${card.color !== 'wild' ? card.color + ' ' : ''}${label}`}
    >
      <div
        className="card-corner tl"
        style={small ? { fontSize: '0.5rem' } : {}}
      >
        {label}
      </div>
      <div className="card-inner" style={small ? { width: 32, height: 52 } : {}}>
        <span
          className={`card-label${isSmallLabel(card.type) ? ' small-label' : ''}`}
          style={small ? { fontSize: isSmallLabel(card.type) ? '0.7rem' : '1rem' } : {}}
        >
          {label}
        </span>
      </div>
      <div
        className="card-corner br"
        style={small ? { fontSize: '0.5rem' } : {}}
      >
        {label}
      </div>
    </div>
  );
};

export default Card;
