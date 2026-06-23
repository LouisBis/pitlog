import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDroppable } from '@dnd-kit/core'
import { useTranslation } from 'react-i18next'
import type { Ticket, TicketStatus } from '@/types'
import TicketCard from './TicketCard'
import CreateTicketForm from './CreateTicketForm'
import styles from './KanbanColumn.module.css'

interface Props {
  status: TicketStatus
  tickets: Ticket[]
  currentKm: number
  kmPerDay: number | null
  userMotoId: number
  forceEditId: number | null
  onForceEditDone: () => void
  justDoneId?: number | null
}

const cardVariants = {
  enter: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -16 },
}

export default function KanbanColumn({ status, tickets, currentKm, kmPerDay, userMotoId, forceEditId, onForceEditDone, justDoneId }: Props) {
  const { t } = useTranslation()
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const [showForm, setShowForm] = useState(false)

  return (
    <div className={[styles.column, isOver && styles.over].filter(Boolean).join(' ')}>
      <div className={styles.header}>
        {t(`board.column.${status}`)}
        <span className={styles.count}>{tickets.length}</span>
      </div>
      <div ref={setNodeRef} className={styles.dropZone}>
        <AnimatePresence initial={false}>
          {tickets.map((ticket) => (
            <motion.div
              key={ticket.id}
              layout
              variants={cardVariants}
              initial="enter"
              animate="visible"
              exit="exit"
              transition={{
                layout: { type: 'spring', stiffness: 320, damping: 30 },
                duration: 0.18,
                ease: 'easeOut',
              }}
              className={justDoneId === ticket.id ? styles.doneFlash : undefined}
            >
              <TicketCard
                ticket={ticket}
                currentKm={currentKm}
                kmPerDay={kmPerDay}
                userMotoId={userMotoId}
                forceEdit={forceEditId === ticket.id}
                onForceEditDone={onForceEditDone}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {status === 'todo' && (
        <>
          <AnimatePresence>
            {showForm && (
              <motion.div
                key="create-form"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16 }}
              >
                <CreateTicketForm userMotoId={userMotoId} onClose={() => setShowForm(false)} />
              </motion.div>
            )}
          </AnimatePresence>
          {!showForm && (
            <button type="button" className={styles.addButton} onClick={() => setShowForm(true)}>
              {t('ticket.action.new')}
            </button>
          )}
        </>
      )}
    </div>
  )
}
