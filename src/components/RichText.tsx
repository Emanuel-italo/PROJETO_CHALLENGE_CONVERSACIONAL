// RichText.tsx
//
// Renderizador mínimo de markdown para as respostas do assistente.
//
// O LLM devolve texto com **negrito**, *itálico*, `código`, listas com hífen e
// listas numeradas. Sem tratamento, isso aparece cru na bolha do chat. Aqui a
// formatação é interpretada com <Text> aninhado, sem biblioteca externa (o que
// também evita a penalidade de "framework fora do escopo das aulas").

import React from "react";
import { StyleProp, Text, TextStyle, View } from "react-native";

type Props = {
  content: string;
  style?: StyleProp<TextStyle>;
  accentColor: string;
  codeBackground: string;
};

const INLINE = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*|`[^`\n]+`)/g;

function renderInline(
  text: string,
  keyPrefix: string,
  accentColor: string,
  codeBackground: string,
): React.ReactNode[] {
  return text
    .split(INLINE)
    .filter((part) => part.length > 0)
    .map((part, index) => {
      const key = `${keyPrefix}-${index}`;

      if (
        (part.startsWith("**") && part.endsWith("**")) ||
        (part.startsWith("__") && part.endsWith("__"))
      ) {
        return (
          <Text key={key} style={{ fontWeight: "800" }}>
            {part.slice(2, -2)}
          </Text>
        );
      }

      if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
        return (
          <Text key={key} style={{ fontStyle: "italic" }}>
            {part.slice(1, -1)}
          </Text>
        );
      }

      if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
        return (
          <Text
            key={key}
            style={{
              backgroundColor: codeBackground,
              color: accentColor,
              fontFamily: "monospace",
              fontSize: 13,
            }}
          >
            {` ${part.slice(1, -1)} `}
          </Text>
        );
      }

      return <Text key={key}>{part}</Text>;
    });
}

export default function RichText({
  content,
  style,
  accentColor,
  codeBackground,
}: Props) {
  const lines = content.replace(/\r/g, "").split("\n");

  return (
    <View>
      {lines.map((line, index) => {
        const trimmed = line.trim();

        if (trimmed.length === 0) {
          return <View key={index} style={{ height: 8 }} />;
        }

        // Título: ### Texto
        const heading = trimmed.match(/^#{1,4}\s+(.*)$/);

        if (heading) {
          return (
            <Text
              key={index}
              style={[style, { fontWeight: "800", marginBottom: 2 }]}
            >
              {renderInline(heading[1], `h${index}`, accentColor, codeBackground)}
            </Text>
          );
        }

        // Lista com marcador: - Texto  /  * Texto
        const bullet = trimmed.match(/^[-*]\s+(.*)$/);

        if (bullet) {
          return (
            <View
              key={index}
              style={{ flexDirection: "row", alignItems: "flex-start" }}
            >
              <Text style={[style, { color: accentColor, marginRight: 6 }]}>
                •
              </Text>

              <Text style={[style, { flex: 1 }]}>
                {renderInline(bullet[1], `b${index}`, accentColor, codeBackground)}
              </Text>
            </View>
          );
        }

        // Lista numerada: 1. Texto
        const numbered = trimmed.match(/^(\d+)\.\s+(.*)$/);

        if (numbered) {
          return (
            <View
              key={index}
              style={{ flexDirection: "row", alignItems: "flex-start" }}
            >
              <Text
                style={[
                  style,
                  { color: accentColor, marginRight: 6, fontWeight: "700" },
                ]}
              >
                {numbered[1]}.
              </Text>

              <Text style={[style, { flex: 1 }]}>
                {renderInline(numbered[2], `n${index}`, accentColor, codeBackground)}
              </Text>
            </View>
          );
        }

        return (
          <Text key={index} style={style}>
            {renderInline(trimmed, `p${index}`, accentColor, codeBackground)}
          </Text>
        );
      })}
    </View>
  );
}