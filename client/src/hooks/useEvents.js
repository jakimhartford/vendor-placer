import { useState, useCallback } from 'react';
import {
  fetchEvents as apiFetchEvents,
  fetchEvent as apiFetchEvent,
  createEvent as apiCreateEvent,
  updateEvent as apiUpdateEvent,
  deleteEvent as apiDeleteEvent,
} from '../api/index.js';

export default function useEvents() {
  const [events, setEvents] = useState([]);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetchEvents();
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEvent = useCallback(async (id) => {
    setLoading(true);
    try {
      const data = await apiFetchEvent(id);
      setCurrentEvent(data);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveNewEvent = useCallback(async (name) => {
    setLoading(true);
    try {
      const result = await apiCreateEvent({ name });
      await loadEvents();
      return result;
    } finally {
      setLoading(false);
    }
  }, [loadEvents]);

  const saveEvent = useCallback(async (id, payload) => {
    setLoading(true);
    try {
      const result = await apiUpdateEvent(id, payload);
      await loadEvents();
      return result;
    } finally {
      setLoading(false);
    }
  }, [loadEvents]);

  const removeEvent = useCallback(async (id) => {
    setLoading(true);
    try {
      await apiDeleteEvent(id);
      if (currentEvent?.id === id) setCurrentEvent(null);
      await loadEvents();
    } finally {
      setLoading(false);
    }
  }, [currentEvent, loadEvents]);

  return {
    events,
    currentEvent,
    currentEventId: currentEvent?.id || null,
    loading,
    loadEvents,
    loadEvent,
    saveNewEvent,
    saveEvent,
    removeEvent,
    setCurrentEvent,
  };
}
