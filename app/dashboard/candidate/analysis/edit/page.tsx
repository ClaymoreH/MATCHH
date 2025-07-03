"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  getCurrentUserCPF,
  updateCandidateBehavioralAnalysis,
  getCandidateData,
  type BehavioralAnalysis,
} from "@/lib/storage";
import { processBehavioralAnalysis } from "@/lib/gemini";

interface FormData {
  section1: Record<string, string>;
  section2: {
    workEnvironment: string[];
    values: string[];
    careerGoals: string;
  };
  section3: Record<string, string | number>;
}

export default function CandidateAnalysisEdit() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    section1: {},
    section2: { workEnvironment: [], values: [], careerGoals: "" },
    section3: {},
  });

  const updateSection1 = useCallback((field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      section1: { ...prev.section1, [field]: value },
    }));
  }, []);

  const updateSection2 = useCallback((field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      section2: { ...prev.section2, [field]: value },
    }));
  }, []);

  const updateSection3 = useCallback((field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      section3: { ...prev.section3, [field]: value },
    }));
  }, []);

  const handleWorkEnvironmentChange = (value: string, checked: boolean) => {
    const current = formData.section2.workEnvironment;
    updateSection2(
      "workEnvironment",
      checked ? [...current, value] : current.filter((item) => item !== value)
    );
  };

  const handleValuesChange = (value: string, checked: boolean) => {
    const current = formData.section2.values;
    if (checked && current.length < 3) {
      updateSection2("values", [...current, value]);
    } else if (!checked) {
      updateSection2("values", current.filter((item) => item !== value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const currentCPF = getCurrentUserCPF();
    if (!currentCPF) {
      alert("Erro: CPF não encontrado. Por favor, complete seu perfil primeiro.");
      router.push("/dashboard/candidate/profile/edit");
      return;
    }

    const requiredFields = ["collaboration", "problemSolving", "communication", "initiative", "adaptation", "influence", "learning"];
    const missingSection1 = requiredFields.some((field) => !formData.section1[field]);

    if (missingSection1 || !formData.section2.careerGoals || formData.section2.values.length === 0) {
      alert("Por favor, complete todos os campos obrigatórios.");
      return;
    }

    setIsProcessing(true);

    try {
      const behavioralAnalysis: BehavioralAnalysis = {
        section1: formData.section1,
        section2: formData.section2,
        section3: formData.section3,
      };

      const basicSuccess = updateCandidateBehavioralAnalysis(currentCPF, behavioralAnalysis);
      if (!basicSuccess) throw new Error("Erro ao salvar dados básicos");

      const aiSuccess = await processBehavioralAnalysis(currentCPF, behavioralAnalysis);

      if (aiSuccess) {
        alert("Análise comportamental processada com sucesso!");
        router.push("/dashboard/candidate");
      } else {
        alert("Dados salvos, mas houve erro na geração de insights.");
        router.push("/dashboard/candidate/analysis");
      }
    } catch (error) {
      console.error("Error processing analysis:", error);
      alert("Erro ao processar análise. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const currentCPF = getCurrentUserCPF();
    if (currentCPF) {
      const candidateData = getCandidateData(currentCPF);
      if (candidateData?.behavioralAnalysis) {
        setFormData(candidateData.behavioralAnalysis);
      }
    }
  }, []);

  const handleTextareaFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const scrollY = window.scrollY;
    setTimeout(() => window.scrollTo({ top: scrollY, behavior: "instant" }), 0);
  };

  const handleTextareaChange = (field: string, value: string, section: number) => {
    const scrollY = window.scrollY;
    if (section === 1) updateSection1(field, value);
    else if (section === 2) updateSection2(field, value);
    else updateSection3(field, value);
    setTimeout(() => window.scrollTo({ top: scrollY, behavior: "instant" }), 0);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Refazer Análise Comportamental</h1>
        <nav className="flex space-x-2 text-sm text-gray-600 mt-2">
          <span>Candidato</span>
          <span>›</span>
          <span>Refazer Análise</span>
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Todas as seções renderizadas em sequência */}
        <Section1 />
        <Section2 />
        <Section3 />

        <div className="flex justify-center pt-6">
          <Button
            type="submit"
            size="lg"
            className="flex items-center px-8"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processando com IA...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Enviar Análise Completa
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );

  // Componentes reutilizáveis abaixo
  function Section1() {
    // ...copie aqui o conteúdo do seu componente <Section1 />
  }

  function Section2() {
    // ...copie aqui o conteúdo do seu componente <Section2 />
  }

  function Section3() {
    // ...copie aqui o conteúdo do seu componente <Section3 />
  }
}
