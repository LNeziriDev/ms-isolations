import React, { useEffect, useState } from 'react'
import Sheet from '@mui/joy/Sheet'
import Typography from '@mui/joy/Typography'
import List from '@mui/joy/List'
import ListItem from '@mui/joy/ListItem'
import { onTiming } from '../lib/api'

export default function Banner() {
  const [events, setEvents] = useState([])
  useEffect(() => onTiming(ev => setEvents(prev => [ev, ...prev].slice(0, 5))), [])
  return (
    <Sheet variant="soft" sx={{ width: 260, p: 2, borderRadius: 'sm', position: 'sticky', top: 16, height: 'max-content' }}>
      <Typography level="title-md" sx={{ mb: 1 }}>Recent calls</Typography>
      {events.length === 0 ? (
        <Typography level="body-sm">none yet</Typography>
      ) : (
        <List size="sm" sx={{ p: 0 }}>
          {events.map((e, idx) => (
            <ListItem key={idx} sx={{ display: 'block', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
              {e.name}: {e.durationMs}ms{' '}
              <Typography component="span" level="body-xs" sx={{ color: 'neutral.500' }}>
                ({e.status})
              </Typography>
            </ListItem>
          ))}
        </List>
      )}
    </Sheet>
  )
}

