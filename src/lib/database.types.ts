export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string
          date: string
          deal_id: string
          hypothesis: string
          id: string
          next_action: string
          result: string
          stage: string
        }
        Insert: {
          created_at?: string
          date?: string
          deal_id: string
          hypothesis?: string
          id?: string
          next_action?: string
          result?: string
          stage?: string
        }
        Update: {
          created_at?: string
          date?: string
          deal_id?: string
          hypothesis?: string
          id?: string
          next_action?: string
          result?: string
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_slots: {
        Row: {
          created_at: string | null
          date: string
          id: string
          reason: string | null
          time_slot: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          reason?: string | null
          time_slot: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          reason?: string | null
          time_slot?: string
        }
        Relationships: []
      }
      closed_days: {
        Row: {
          created_at: string | null
          created_by: string | null
          date: string
          id: string
          reason: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date: string
          id?: string
          reason?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      deals: {
        Row: {
          assignee: string
          category: string
          company_name: string
          contact_name: string
          created_at: string
          deal_number: string
          hypothesis: string
          id: string
          next_action: string
          result: string
          scheduled_date: string | null
          stage: string
          updated_at: string
          won_amount: number
        }
        Insert: {
          assignee?: string
          category: string
          company_name: string
          contact_name?: string
          created_at?: string
          deal_number: string
          hypothesis?: string
          id?: string
          next_action?: string
          result?: string
          scheduled_date?: string | null
          stage?: string
          updated_at?: string
          won_amount?: number
        }
        Update: {
          assignee?: string
          category?: string
          company_name?: string
          contact_name?: string
          created_at?: string
          deal_number?: string
          hypothesis?: string
          id?: string
          next_action?: string
          result?: string
          scheduled_date?: string | null
          stage?: string
          updated_at?: string
          won_amount?: number
        }
        Relationships: []
      }
      oem_activities: {
        Row: {
          action: string
          created_at: string
          date: string
          id: string
          new_status: Database["public"]["Enums"]["oem_status"] | null
          note: string
          old_status: Database["public"]["Enums"]["oem_status"] | null
          project_id: string
        }
        Insert: {
          action?: string
          created_at?: string
          date?: string
          id?: string
          new_status?: Database["public"]["Enums"]["oem_status"] | null
          note?: string
          old_status?: Database["public"]["Enums"]["oem_status"] | null
          project_id: string
        }
        Update: {
          action?: string
          created_at?: string
          date?: string
          id?: string
          new_status?: Database["public"]["Enums"]["oem_status"] | null
          note?: string
          old_status?: Database["public"]["Enums"]["oem_status"] | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oem_activities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "oem_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      oem_projects: {
        Row: {
          assignee: string
          bottle_size: string | null
          bottle_source:
            | Database["public"]["Enums"]["procurement_source"]
            | null
          bottle_type: string
          bulk_delivery: boolean | null
          cap_source: Database["public"]["Enums"]["procurement_source"] | null
          cap_type: string
          company_name: string
          contact_address: string
          contact_email: string
          contact_person_name: string
          contact_phone: string
          cost_price: number | null
          created_at: string
          delivery_address: string | null
          delivery_company_name: string | null
          delivery_date: string | null
          delivery_location: string
          delivery_phone: string | null
          estimate_memo: string
          flavor_direction: string
          id: string
          label_design:
            | Database["public"]["Enums"]["label_design_source"]
            | null
          label_paper: string
          label_relationship_note: string
          label_source: Database["public"]["Enums"]["procurement_source"] | null
          lees_handling: Database["public"]["Enums"]["lees_handling"] | null
          notes: string
          oem_collab: string
          over_quantity_policy: string
          payment_amount: number | null
          payment_date: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          project_number: string
          required_bottles: number | null
          rice_amount_kg: number | null
          rice_grade: Database["public"]["Enums"]["rice_grade"] | null
          rice_polishing: number | null
          rice_source: Database["public"]["Enums"]["procurement_source"] | null
          rice_type: string
          sake_license: string | null
          sake_name: string
          sales_bottles: string | null
          sales_deal_id: string | null
          ship_to: string
          shipping_cost: number | null
          shipping_date: string | null
          split_delivery_detail: string
          status: Database["public"]["Enums"]["oem_status"]
          target_sale_date: string | null
          temperature:
            | Database["public"]["Enums"]["shipping_temperature"]
            | null
          total_bottles: string | null
          total_liters: number | null
          under_quantity_policy: string
          unit_price: number | null
          updated_at: string
          use_wooden_barrel: boolean
          yeast: string
        }
        Insert: {
          assignee?: string
          bottle_size?: string | null
          bottle_source?:
            | Database["public"]["Enums"]["procurement_source"]
            | null
          bottle_type?: string
          bulk_delivery?: boolean | null
          cap_source?: Database["public"]["Enums"]["procurement_source"] | null
          cap_type?: string
          company_name: string
          contact_address?: string
          contact_email?: string
          contact_person_name?: string
          contact_phone?: string
          cost_price?: number | null
          created_at?: string
          delivery_address?: string | null
          delivery_company_name?: string | null
          delivery_date?: string | null
          delivery_location?: string
          delivery_phone?: string | null
          estimate_memo?: string
          flavor_direction?: string
          id?: string
          label_design?:
            | Database["public"]["Enums"]["label_design_source"]
            | null
          label_paper?: string
          label_relationship_note?: string
          label_source?:
            | Database["public"]["Enums"]["procurement_source"]
            | null
          lees_handling?: Database["public"]["Enums"]["lees_handling"] | null
          notes?: string
          oem_collab?: string
          over_quantity_policy?: string
          payment_amount?: number | null
          payment_date?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          project_number: string
          required_bottles?: number | null
          rice_amount_kg?: number | null
          rice_grade?: Database["public"]["Enums"]["rice_grade"] | null
          rice_polishing?: number | null
          rice_source?: Database["public"]["Enums"]["procurement_source"] | null
          rice_type?: string
          sake_license?: string | null
          sake_name?: string
          sales_bottles?: string | null
          sales_deal_id?: string | null
          ship_to?: string
          shipping_cost?: number | null
          shipping_date?: string | null
          split_delivery_detail?: string
          status?: Database["public"]["Enums"]["oem_status"]
          target_sale_date?: string | null
          temperature?:
            | Database["public"]["Enums"]["shipping_temperature"]
            | null
          total_bottles?: string | null
          total_liters?: number | null
          under_quantity_policy?: string
          unit_price?: number | null
          updated_at?: string
          use_wooden_barrel?: boolean
          yeast?: string
        }
        Update: {
          assignee?: string
          bottle_size?: string | null
          bottle_source?:
            | Database["public"]["Enums"]["procurement_source"]
            | null
          bottle_type?: string
          bulk_delivery?: boolean | null
          cap_source?: Database["public"]["Enums"]["procurement_source"] | null
          cap_type?: string
          company_name?: string
          contact_address?: string
          contact_email?: string
          contact_person_name?: string
          contact_phone?: string
          cost_price?: number | null
          created_at?: string
          delivery_address?: string | null
          delivery_company_name?: string | null
          delivery_date?: string | null
          delivery_location?: string
          delivery_phone?: string | null
          estimate_memo?: string
          flavor_direction?: string
          id?: string
          label_design?:
            | Database["public"]["Enums"]["label_design_source"]
            | null
          label_paper?: string
          label_relationship_note?: string
          label_source?:
            | Database["public"]["Enums"]["procurement_source"]
            | null
          lees_handling?: Database["public"]["Enums"]["lees_handling"] | null
          notes?: string
          oem_collab?: string
          over_quantity_policy?: string
          payment_amount?: number | null
          payment_date?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          project_number?: string
          required_bottles?: number | null
          rice_amount_kg?: number | null
          rice_grade?: Database["public"]["Enums"]["rice_grade"] | null
          rice_polishing?: number | null
          rice_source?: Database["public"]["Enums"]["procurement_source"] | null
          rice_type?: string
          sake_license?: string | null
          sake_name?: string
          sales_bottles?: string | null
          sales_deal_id?: string | null
          ship_to?: string
          shipping_cost?: number | null
          shipping_date?: string | null
          split_delivery_detail?: string
          status?: Database["public"]["Enums"]["oem_status"]
          target_sale_date?: string | null
          temperature?:
            | Database["public"]["Enums"]["shipping_temperature"]
            | null
          total_bottles?: string | null
          total_liters?: number | null
          under_quantity_policy?: string
          unit_price?: number | null
          updated_at?: string
          use_wooden_barrel?: boolean
          yeast?: string
        }
        Relationships: [
          {
            foreignKeyName: "oem_projects_sales_deal_id_fkey"
            columns: ["sales_deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_data_status: {
        Row: {
          department: string
          id: number
          period: string
          submitted_at: string
          submitted_by: string
        }
        Insert: {
          department: string
          id?: never
          period: string
          submitted_at?: string
          submitted_by: string
        }
        Update: {
          department?: string
          id?: never
          period?: string
          submitted_at?: string
          submitted_by?: string
        }
        Relationships: []
      }
      stock_edit_history: {
        Row: {
          changes: Json
          edited_at: string | null
          edited_by: string | null
          id: string
          record_id: string
          table_name: string
        }
        Insert: {
          changes: Json
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          record_id: string
          table_name: string
        }
        Update: {
          changes?: Json
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      stock_history: {
        Row: {
          changed_field: string
          created_at: string | null
          destination: string | null
          id: string
          item_id: string
          new_value: number | null
          note: string | null
          old_value: number | null
          operator_name: string | null
        }
        Insert: {
          changed_field: string
          created_at?: string | null
          destination?: string | null
          id?: string
          item_id: string
          new_value?: number | null
          note?: string | null
          old_value?: number | null
          operator_name?: string | null
        }
        Update: {
          changed_field?: string
          created_at?: string | null
          destination?: string | null
          id?: string
          item_id?: string
          new_value?: number | null
          note?: string | null
          old_value?: number | null
          operator_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_history_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_incoming: {
        Row: {
          created_at: string | null
          date: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          item_id: string
          memo: string | null
          operator_name: string | null
          quantity: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          item_id: string
          memo?: string | null
          operator_name?: string | null
          quantity: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          item_id?: string
          memo?: string | null
          operator_name?: string | null
          quantity?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_incoming_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_inventory: {
        Row: {
          defective_ng: number
          defective_ok: number
          id: string
          item_id: string
          reserve_damaged: number
          reserve_domestic: number
          reserve_domestic_memo: string | null
          reserve_export: number
          reserve_export_memo: string | null
          reserve_frame_liquor: number
          reserve_frame_online: number
          reserve_frame_shop: number
          reserve_online: number
          reserve_online_memo: string | null
          reserve_shop: number
          reserve_shop_memo: string | null
          total: number
          updated_at: string | null
        }
        Insert: {
          defective_ng?: number
          defective_ok?: number
          id?: string
          item_id: string
          reserve_damaged?: number
          reserve_domestic?: number
          reserve_domestic_memo?: string | null
          reserve_export?: number
          reserve_export_memo?: string | null
          reserve_frame_liquor?: number
          reserve_frame_online?: number
          reserve_frame_shop?: number
          reserve_online?: number
          reserve_online_memo?: string | null
          reserve_shop?: number
          reserve_shop_memo?: string | null
          total?: number
          updated_at?: string | null
        }
        Update: {
          defective_ng?: number
          defective_ok?: number
          id?: string
          item_id?: string
          reserve_damaged?: number
          reserve_domestic?: number
          reserve_domestic_memo?: string | null
          reserve_export?: number
          reserve_export_memo?: string | null
          reserve_frame_liquor?: number
          reserve_frame_online?: number
          reserve_frame_shop?: number
          reserve_online?: number
          reserve_online_memo?: string | null
          reserve_shop?: number
          reserve_shop_memo?: string | null
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_items: {
        Row: {
          code: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          storage_location: string | null
          updated_at: string | null
          volume: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          storage_location?: string | null
          updated_at?: string | null
          volume?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          storage_location?: string | null
          updated_at?: string | null
          volume?: string | null
        }
        Relationships: []
      }
      stock_movement: {
        Row: {
          created_at: string | null
          date: string
          deleted_at: string | null
          deleted_by: string | null
          delta: number
          field: string
          id: string
          item_id: string
          memo: string | null
          operator_name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          deleted_at?: string | null
          deleted_by?: string | null
          delta: number
          field: string
          id?: string
          item_id: string
          memo?: string | null
          operator_name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          deleted_at?: string | null
          deleted_by?: string | null
          delta?: number
          field?: string
          id?: string
          item_id?: string
          memo?: string | null
          operator_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movement_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_outgoing: {
        Row: {
          created_at: string | null
          date: string
          deleted_at: string | null
          deleted_by: string | null
          destination: string | null
          id: string
          item_id: string
          memo: string | null
          operator_name: string | null
          quantity: number
          shipment_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          deleted_at?: string | null
          deleted_by?: string | null
          destination?: string | null
          id?: string
          item_id: string
          memo?: string | null
          operator_name?: string | null
          quantity: number
          shipment_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          deleted_at?: string | null
          deleted_by?: string | null
          destination?: string | null
          id?: string
          item_id?: string
          memo?: string | null
          operator_name?: string | null
          quantity?: number
          shipment_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_outgoing_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_reservations: {
        Row: {
          cancel_token: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          company_name: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          contact_name: string | null
          created_at: string | null
          date: string
          email: string | null
          fax: string | null
          id: string
          name: string | null
          notes: string | null
          num_people: number
          phone: string | null
          status: string
          time_slot: string
          transportation: string | null
          type: string
        }
        Insert: {
          cancel_token?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          company_name?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          contact_name?: string | null
          created_at?: string | null
          date: string
          email?: string | null
          fax?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          num_people: number
          phone?: string | null
          status?: string
          time_slot: string
          transportation?: string | null
          type: string
        }
        Update: {
          cancel_token?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          company_name?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          contact_name?: string | null
          created_at?: string | null
          date?: string
          email?: string | null
          fax?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          num_people?: number
          phone?: string | null
          status?: string
          time_slot?: string
          transportation?: string | null
          type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      label_design_source: "依頼主側" | "土田側" | "外注" | "お客様側"
      lees_handling:
        | "依頼主が引取"
        | "土田側で引取"
        | "未定"
        | "お客様がすべて引取"
        | "お客様が一部引取"
        | "土田酒造側で引取"
      oem_status:
        | "見積中"
        | "受注"
        | "製造準備"
        | "仕込み中"
        | "製造完了"
        | "瓶詰待ち"
        | "瓶詰中"
        | "出荷準備"
        | "出荷完了"
        | "完了"
      payment_status: "未入金" | "一部入金" | "入金済"
      procurement_source: "依頼主側" | "土田側" | "お客様側"
      rice_grade: "1等" | "2等" | "3等" | "等外" | "その他"
      shipping_temperature: "冷蔵" | "常温"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      label_design_source: ["依頼主側", "土田側", "外注", "お客様側"],
      lees_handling: [
        "依頼主が引取",
        "土田側で引取",
        "未定",
        "お客様がすべて引取",
        "お客様が一部引取",
        "土田酒造側で引取",
      ],
      oem_status: [
        "見積中",
        "受注",
        "製造準備",
        "仕込み中",
        "製造完了",
        "瓶詰待ち",
        "瓶詰中",
        "出荷準備",
        "出荷完了",
        "完了",
      ],
      payment_status: ["未入金", "一部入金", "入金済"],
      procurement_source: ["依頼主側", "土田側", "お客様側"],
      rice_grade: ["1等", "2等", "3等", "等外", "その他"],
      shipping_temperature: ["冷蔵", "常温"],
    },
  },
} as const
