
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mlmqhtvjhqkkaehgeomc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sbXFodHZqaHFra2FlaGdlb21jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwODQwNDgsImV4cCI6MjA2MDY2MDA0OH0._HIuEJKtDvbzNVyLd2eGrCbrs6uIidS9-JlN-ZFXNNs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
